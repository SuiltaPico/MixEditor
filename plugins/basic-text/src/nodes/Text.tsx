import {
  BrowserViewPluginResult,
  get_caret_pos_from_point,
  NodeRenderer,
  PointerEventDecision,
  SelectedMaskDecision,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  NavigateDirection,
  CaretNavigateEnterDecision,
  get_node_path,
  MixEditorPluginContext,
  Node,
  path_compare,
  TransferDataObject,
  DeleteFromPointDecision,
  create_DeleteRangeOperation,
  DeleteRangeDecision,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    text: TextNode;
  }
}

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
}

export function create_TextTDO(id: string, content: string) {
  return {
    id,
    type: "text",
    content,
  } satisfies TextNodeTDO;
}

export interface TextNode extends Node {
  type: "text";
  text: WrappedSignal<string>;
}

export function create_TextNode(id: string, text: string) {
  return {
    id,
    type: "text",
    text: createSignal(text),
  } satisfies TextNode;
}

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
        plugin_manager,
        saver,
        selection,
        operation_manager,
      } = editor;
      const browser_view_plugin =
        await plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const { renderer_manager } = browser_view_plugin;

      saver.register_loader<TextNodeTDO>("text", (tdo) => {
        const node = create_TextNode(tdo.id, tdo.content);
        node_manager.record_node(node);
        return node;
      });

      node_manager.register_handlers("text", {
        save: (_, node) => {
          return {
            id: node.id,
            type: "text",
            content: node.text.get(),
          } satisfies TextNodeTDO;
        },

        get_children_count: (_, node) => {
          return node.text.get().length;
        },

        slice: (_, node, start, end) => {
          return node_manager.create_node(
            create_TextNode,
            node.text.get().slice(start, end)
          );
        },

        delete_children: async (_, node, from, to) => {
          const text = node.text.get();
          const new_value = text.slice(0, from) + text.slice(to + 1);
          const slice_text = text.slice(from, to + 1);
          node.text.set(new_value);

          return [
            create_TextTDO(node_manager.generate_id(), slice_text) as any,
          ];
        },

        handle_caret_navigate: (_, node, to, direction) => {
          const text = node.text.get();
          to += direction;
          if (to > text.length) {
            to = text.length;
          }
          const to_prev = direction === NavigateDirection.Prev;

          if ((to_prev && to >= text.length) || (!to_prev && to <= 0)) {
            // 顺方向前边界进入
            return CaretNavigateEnterDecision.Enter(
              to_prev ? text.length - 1 : 1
            );
          } else if ((to_prev && to <= 0) || (!to_prev && to >= text.length)) {
            // 顺方向后边界跳过
            return CaretNavigateEnterDecision.Skip;
          } else {
            return CaretNavigateEnterDecision.Enter(to);
          }
        },

        handle_delete_from_point: (_, node, from, direction) => {
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
        },

        handle_delete_range: (_, node, from, to) => {
          const text = node.text.get();
          if (text.length === 0) return DeleteRangeDecision.DeleteSelf;

          return DeleteRangeDecision.Done({
            operation: operation_manager.create_operation(
              create_DeleteRangeOperation,
              node.id,
              from,
              from + 1
            ),
          });
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

        "bv:handle_pointer_down": (_, node, element, event) => {
          event.context.bv_handled = true;
          const raw_event = event.raw;
          const result = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )!;
          if (!result) return PointerEventDecision.none;
          editor.selection.collapsed_select({
            node,
            child_path: result.offset,
          });
          return PointerEventDecision.none;
        },

        "bv:handle_selected_mask": (_, node, from, to) => {
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed") return SelectedMaskDecision.skip;

          const context = node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return SelectedMaskDecision.skip;

          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();
          const range = document.createRange();
          const text_node = html_node.firstChild;
          if (!text_node) return SelectedMaskDecision.skip;

          const adjusted_to = Math.min(node.text.get().length, to);
          range.setStart(text_node, from);
          range.setEnd(text_node, adjusted_to);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            return SelectedMaskDecision.render(
              Array.from(range_rects).map((rect) => ({
                x: rect.left - root_rect.left,
                y: rect.top - root_rect.top,
                width: rect.width,
                height: rect.height,
              }))
            );
          } else {
            return SelectedMaskDecision.skip;
          }
        },

        "bv:handle_pointer_move": async (_, node, element, event) => {
          const raw_event = event.raw;
          if (raw_event.buttons !== 1) return PointerEventDecision.none;
          // TODO：下面函数通过节流函数触发，确保最小采样率是 60fps

          // 获取选区
          const selected = editor.selection.get_selected();
          if (!selected) return PointerEventDecision.none;

          // 计算鼠标所在的字符索引
          const mouse_index = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )?.offset;
          if (!mouse_index) return PointerEventDecision.none;

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

          return PointerEventDecision.none;
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

      // 注册渲染器
      renderer_manager.register("text", TextRenderer);
    },
    dispose() {},
  };
}
