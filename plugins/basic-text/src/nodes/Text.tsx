import {
  BrowserViewPluginResult,
  BvDrawSelectedMaskDecision,
  BvPointerEventDecision,
  get_caret_pos_from_point,
  NodeRenderer,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  CaretNavigateDecision,
  create_DeferredOperation,
  create_DeleteRangeOperation,
  create_DynamicStrategy,
  create_InsertChildrenOperation,
  create_Node,
  DeleteFromPointDecision,
  DeleteRangeDecision,
  get_node_path,
  InsertNodesDecision,
  load_mark_map,
  mark_map_is_equal,
  MarkMap,
  MarkTDOMap,
  MergeNodeDecision,
  MixEditorPluginContext,
  NavigateDirection,
  Node,
  NodeTDO,
  path_compare,
  save_mark_map,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    text: TextNode;
  }
  interface AllEvents {
    "text:filter_merging_node": TextFilterMergingNodeEvent;
  }
}

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
  marks: MarkTDOMap;
}

export function create_TextTDO(
  id: string,
  content: string,
  marks?: MarkTDOMap
) {
  return {
    id,
    type: "text",
    content,
    marks: marks ?? {},
  } satisfies TextNodeTDO;
}

/** 文本节点。 */
export interface TextNode extends Node {
  type: "text";
  text: WrappedSignal<string>;
  marks: WrappedSignal<MarkMap>;
}

export function create_TextNode(id: string, text: string, marks?: MarkMap) {
  return create_Node<TextNode>({
    id,
    type: "text",
    text: createSignal(text),
    marks: createSignal<MarkMap>(marks ?? {}),
  });
}

export interface TextFilterMergingNodeEvent {
  type: "text:filter_merging_node";
  target: Node[];
}

// export async function filter_merging_node_schema_check(
//   params: Parameters<
//     EventHandler<TextFilterMergingNodeEvent, MixEditorEventManagerContext>
//   >[0]
// ) {
//   const { event, wait_dependencies, manager_context } = params;
//   await wait_dependencies();
//   const { target } = event;
//   const { node_manager } = manager_context.editor;
//   return target.filter((node) => {
//     return node_manager.is_allow_to_merge("text", node.type);
//   });
// }

// export async function filter_merging_node_marks_check(
//   params: Parameters<
//     EventHandler<TextFilterMergingNodeEvent, MixEditorEventManagerContext>
//   >[0]
// ) {
//   const { event, wait_dependencies, manager_context } = params;
// }

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  const { node, editor } = props;

  let container!: WithMixEditorNode<HTMLElement>;
  onMount(() => {
    container.mixed_node = node;
    const context = editor.node_manager.get_context(node);
    if (context) {
      context["bv:html_node"] = container;
    }
  });

  return (
    <span class="_text" ref={container}>
      {node.text.get()}
    </span>
  );
};

export function text() {
  return {
    id: "text",
    async init(ctx: MixEditorPluginContext) {
      const { editor } = ctx;
      const {
        node_manager,
        node_tdo_manager,
        mark_manager,
        mark_tdo_manager,
        plugin_manager,
        selection,
        operation_manager,
        event_manager,
      } = editor;

      const browser_view_plugin =
        await plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const { renderer_manager } = browser_view_plugin;

      async function is_mergeable(self_marks: MarkMap, tdo: NodeTDO) {
        if (!node_manager.is_allow_to_merge("text", tdo.type)) return false;
        const node_marks = await load_mark_map(
          mark_tdo_manager,
          await node_tdo_manager.execute_handler("get_marks", tdo)!
        );
        return mark_map_is_equal(mark_manager, self_marks, node_marks);
      }

      // event_manager.add_handler(
      //   "text:filter_merging_node",
      //   filter_merging_node_schema_check,
      //   {
      //     dependencies: [],
      //     tags: ["text:node_schema_check"],
      //   }
      // );
      // event_manager.add_handler(
      //   "text:filter_merging_node",
      //   filter_merging_node_marks_check,
      //   {
      //     dependencies: [filter_merging_node_schema_check as any],
      //     tags: ["text:node_marks_check"],
      //   }
      // );

      node_tdo_manager.register_handler("text", "to_node", async (_, tdo) => {
        const ttdo = tdo as TextNodeTDO;
        const node = create_TextNode(
          ttdo.id,
          ttdo.content,
          await load_mark_map(node_tdo_manager, ttdo.marks)
        );
        node_manager.record_node(node);
        return node;
      });

      node_manager.set_tag("text", ["inline", "text_container"]);
      node_manager.set_mergeable_into_tags("text", [
        "inline_container",
        "text_container",
      ]);

      node_manager.register_handlers("text", {
        to_tdo: async (_, node) => {
          return {
            id: node.id,
            type: "text",
            content: node.text.get(),
            marks: await save_mark_map(mark_manager, node.marks.get()),
          } satisfies TextNodeTDO;
        },

        get_children_count: (_, node) => {
          return node.text.get().length;
        },

        split(_, node, indexes) {
          const text = node.text.get();
          const result = [];
          for (const index of indexes) {
            result.push(
              create_TextNode(node_manager.gen_id(), text.slice(index))
            );
          }
          return result;
        },

        insert_children: (_, node, to, children) => {
          console.log("text:insert_children", node, to, children);

          const text = node.text.get();
          const new_value =
            text.slice(0, to) +
            children
              .filter((child) => child.type === "text")
              .map((it) => (it as TextNodeTDO).content)
              .join("") +
            text.slice(to);
          node.text.set(new_value);
        },

        delete_children: async (_, node, from, to) => {
          const text = node.text.get();
          const new_value = text.slice(0, from) + text.slice(to + 1);
          const slice_text = text.slice(from, to + 1);
          node.text.set(new_value);

          return [create_TextTDO(node_manager.gen_id(), slice_text)];
        },

        "bv:handle_delegated_pointer_down": (_, node, event, caret_pos) => {
          const html_node = node_manager.get_context(node)?.["bv:html_node"];
          // 应该是文本节点
          if (!html_node || caret_pos.node !== html_node.firstChild) return;

          const rect_index = caret_pos.offset;
          selection.collapsed_select({
            node,
            child_path: rect_index,
          });
          return;
        },

        "bv:get_child_caret": (_, node, index) => {
          const context = editor.node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return undefined;
          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();

          const range = document.createRange();
          const text_node = html_node.firstChild;
          if (!text_node) throw new Error("文本节点的起始节点丢失。");

          if (index < node.text.get().length) {
            range.setStart(html_node.firstChild!, index);
          } else {
            range.setStart(html_node.firstChild!, index);
          }

          range.collapse(true);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            const caret_rect = range_rects[0];
            return {
              x: caret_rect.left - root_rect.left - 1,
              y: caret_rect.top - root_rect.top,
              height: caret_rect.height,
            };
          } else {
            // 处理没有rect的情况，比如文本为空
            // 使用html_node的位置作为默认
            const node_rect = html_node.getBoundingClientRect();
            return {
              x: node_rect.left - root_rect.left - 1,
              y: node_rect.top - root_rect.top,
              height: node_rect.height,
            };
          }
        },
      });

      node_manager.register_strategies("text", {
        caret_navigate: create_DynamicStrategy((_, node, context) => {
          const text = node.text.get();
          let { from, direction } = context;
          from += direction;
          if (from > text.length) {
            from = text.length;
          }
          const to_prev = direction === NavigateDirection.Prev;

          if ((to_prev && from >= text.length) || (!to_prev && from <= 0)) {
            // 顺方向前边界进入
            return CaretNavigateDecision.Enter(to_prev ? text.length - 1 : 1);
          } else if (
            (to_prev && from <= 0) ||
            (!to_prev && from >= text.length)
          ) {
            // 顺方向后边界跳过
            return CaretNavigateDecision.Skip;
          } else {
            return CaretNavigateDecision.Enter(from);
          }
        }),

        insert_nodes: create_DynamicStrategy(async (_, node, context) => {
          let { insert_index, nodes_to_insert } = context;
          const text = node.text.get();

          // 边界修复
          if (insert_index < 0) insert_index = 0;
          if (insert_index > text.length) insert_index = text.length;

          const self_marks = await node_manager.execute_handler(
            "get_marks",
            node
          )!;

          // 从头开始合并，直到遇到不能合并的节点
          const head_nodes = [];
          let head_content_length = 0;
          let head_text_content = "";
          for (const node of nodes_to_insert) {
            if (!(await is_mergeable(self_marks, node))) break;
            head_nodes.push(node);
            let node_text;
            if (node.type === "text") {
              node_text = (node as TextNodeTDO).content;
            } else {
              node_text = await node_tdo_manager.execute_handler(
                "to_plain_text",
                node
              )!;
            }
            head_content_length += node_text.length;
            head_text_content += node_text;
          }

          // 如果还有剩余节点，则从尾部开始合并，直到遇到非文本节点
          const tail_nodes = [];
          let tail_text_content = "";
          for (let i = nodes_to_insert.length - 1; i >= 0; i--) {
            const node = nodes_to_insert[i];
            if (!(await is_mergeable(self_marks, node))) break;
            let node_text;
            if (node.type === "text") {
              node_text = (node as TextNodeTDO).content;
            } else {
              node_text = await node_tdo_manager.execute_handler(
                "to_plain_text",
                node
              )!;
            }
            tail_nodes.push(node);
            tail_text_content += node_text;
          }

          return InsertNodesDecision.Accept({
            operations: [
              // 先插入尾部节点，因为尾部节点插入后，插入位置会发生变化
              operation_manager.create_operation(
                create_InsertChildrenOperation,
                node.id,
                insert_index,
                [node_tdo_manager.create_tdo(create_TextTDO, tail_text_content)]
              ),
              // 插入头部节点
              operation_manager.create_operation(
                create_InsertChildrenOperation,
                node.id,
                insert_index,
                [node_tdo_manager.create_tdo(create_TextTDO, head_text_content)]
              ),
            ],
            // 拒绝剩余的节点
            rejected_nodes: nodes_to_insert.slice(
              head_nodes.length,
              nodes_to_insert.length - tail_nodes.length
            ),
            split_index: insert_index + head_content_length,
          });
        }),

        delete_from_point: create_DynamicStrategy((_, node, context) => {
          const { from, direction } = context;
          const text = node.text.get();
          const to_prev = direction === NavigateDirection.Prev;
          if (to_prev) {
            if (from <= 0) return DeleteFromPointDecision.Skip;
            // 直接通过原文本长度判断是否需要删除自身
            if (text.length === 1) return DeleteFromPointDecision.DeleteSelf;

            return DeleteFromPointDecision.Done({
              operation: operation_manager.create_operation(
                create_DeleteRangeOperation,
                node.id,
                from - 1,
                from
              ),
              selected: {
                type: "collapsed",
                start: {
                  node,
                  child_path: from - 1,
                },
              },
            });
          } else {
            if (from >= text.length) return DeleteFromPointDecision.Skip;
            // 直接通过原文本长度判断是否需要删除自身
            if (text.length === 1) return DeleteFromPointDecision.DeleteSelf;

            return DeleteFromPointDecision.Done({
              operation: operation_manager.create_operation(
                create_DeleteRangeOperation,
                node.id,
                from,
                from + 1
              ),
            });
          }
        }),

        delete_range: create_DynamicStrategy((_, node, context) => {
          const { start, end } = context;
          const text = node.text.get();
          // console.log(node, "handle_delete_range", from, to);

          if (start <= 0 && end >= text.length) {
            return DeleteRangeDecision.DeleteSelf;
          } else {
            return DeleteRangeDecision.Done({
              operation: operation_manager.create_operation(
                create_DeleteRangeOperation,
                node.id,
                start,
                end - 1
              ),
            });
          }
        }),

        merge_node: create_DynamicStrategy(async (_, node, context) => {
          const { target } = context;
          // event_manager.emit(create_MergeNodeEvent(node, target));
          // return MergeNodeDecision.Reject;

          if (await is_mergeable(node.marks.get(), target as any)) {
            return MergeNodeDecision.Reject;
          }

          const generate_insert_children_operation = async () => [
            operation_manager.create_operation(
              create_InsertChildrenOperation,
              node.id,
              node.text.get().length,
              [
                create_TextTDO(
                  node_manager.gen_id(),
                  await node_manager.execute_handler("to_plain_text", target)!
                ),
              ]
            ),
          ];

          return MergeNodeDecision.Done({
            operations: [
              operation_manager.create_operation(
                create_DeferredOperation,
                generate_insert_children_operation
              ),
            ],
          });
        }),

        "bv:pointer_down": create_DynamicStrategy((_, node, context) => {
          const { event } = context;
          event.context.bv_handled = true;
          const raw_event = event.raw;
          const result = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )!;
          if (!result) return BvPointerEventDecision.none;
          editor.selection.collapsed_select({
            node,
            child_path: result.offset,
          });
          return BvPointerEventDecision.none;
        }),

        "bv:draw_selected_mask": create_DynamicStrategy((_, node, params) => {
          const { from, to } = params;
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed")
            return BvDrawSelectedMaskDecision.skip;

          const context = node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return BvDrawSelectedMaskDecision.skip;

          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();
          const range = document.createRange();
          const text_node = html_node.firstChild;
          if (!text_node) return BvDrawSelectedMaskDecision.skip;

          const adjusted_to = Math.min(node.text.get().length, to);
          range.setStart(text_node, from);
          range.setEnd(text_node, adjusted_to);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            return BvDrawSelectedMaskDecision.render(
              Array.from(range_rects).map((rect) => ({
                x: rect.left - root_rect.left,
                y: rect.top - root_rect.top,
                width: rect.width,
                height: rect.height,
              }))
            );
          } else {
            return BvDrawSelectedMaskDecision.skip;
          }
        }),

        "bv:pointer_move": create_DynamicStrategy(async (_, node, context) => {
          const { event } = context;
          const raw_event = event.raw;

          if (raw_event.buttons !== 1) return BvPointerEventDecision.none;
          // TODO：下面函数通过节流函数触发，确保最小采样率是 60fps

          // 获取选区
          const selected = editor.selection.get_selected();
          if (!selected) return BvPointerEventDecision.none;

          // 计算鼠标所在的字符索引
          const mouse_index = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )?.offset;
          if (!mouse_index) return BvPointerEventDecision.none;

          // 获取自己的路径和选区起始节点的路径
          const self_path = await get_node_path(editor.node_manager, node);

          // TODO：移动并不会影响节点树的变化，节点可以缓存自己的路径，甚至是比较结果。
          // TODO：因为节点变更会更新 update_count，只需要比对 update_count 即可判断要不要重新计算一次先后了。

          // 利用比较函数，计算鼠标位置相对于选区起始节点或者锚点位置在前还是后，
          // 然后根据比较结果，选择之前选区到新选区的转换模式。

          const new_selected_info = {
            node,
            child_path: mouse_index,
          };

          if (selected.type === "collapsed") {
            const start_path = await get_node_path(
              editor.node_manager,
              selected.start.node
            );

            let compare_result;
            if (selected.start.node === node) {
              compare_result = mouse_index - selected.start.child_path;
            } else {
              compare_result = path_compare(self_path, start_path);
            }

            if (compare_result < 0) {
              // 转换模式：
              // s c
              // s e
              editor.selection.extended_select(
                new_selected_info,
                selected.start,
                "end"
              );
            } else if (compare_result > 0) {
              // 转换模式：
              // s c
              // s e
              editor.selection.extended_select(
                selected.start,
                new_selected_info,
                "start"
              );
            }
          } else if (selected.type === "extended") {
            const anchor = selected["anchor"];
            const anchor_info = selected[anchor];
            const anchor_path = await get_node_path(
              editor.node_manager,
              anchor_info.node
            );

            let compare_result;
            if (anchor_info.node === node) {
              compare_result = mouse_index - anchor_info.child_path;
            } else {
              compare_result = path_compare(self_path, anchor_path);
            }

            if (compare_result < 0) {
              // 转换模式：
              // c a
              // s e
              editor.selection.extended_select(
                new_selected_info,
                anchor_info,
                "end"
              );
            } else if (compare_result > 0) {
              // 转换模式：
              // a c
              // s e
              editor.selection.extended_select(
                anchor_info,
                new_selected_info,
                "start"
              );
            }
          }

          return BvPointerEventDecision.none;
        }),
      });

      // 注册渲染器
      renderer_manager.register("text", TextRenderer);
    },
    dispose() {},
  };
}
