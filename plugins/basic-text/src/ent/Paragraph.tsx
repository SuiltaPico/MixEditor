import {
  BrowserViewPluginResult,
  get_caret_pos_from_point,
  is_ancestor,
  NodeRenderer,
  BvPointerEventDecision,
  BvDrawSelectedMaskDecision,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  AnyTDO,
  CaretNavigateDecision,
  CaretNavigateSource,
  create_DeferredOperation,
  create_DynamicStrategy,
  create_InsertChildrenOperation,
  create_Node,
  create_NodeRefTDO,
  DeleteFromPointDecision,
  load_mark_map,
  MarkMap,
  MarkTDOMap,
  MergeNodeDecision,
  MixEditorPluginContext,
  NavigateDirection,
  Node,
  NodeRefTDO,
  paragraph_delete_children,
  paragraph_delete_range_strategy,
  save_mark_map,
  TransferDataObject,
} from "@mixeditor/core";
import { createEffect, onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    paragraph: ParagraphNode;
  }
}

export interface ParagraphNodeTDO extends TransferDataObject {
  type: "paragraph";
  children: AnyTDO[];
  marks: MarkTDOMap;
}

export function create_ParagraphNodeTDO(
  id: string,
  children: AnyTDO[],
  marks?: MarkTDOMap
) {
  return {
    id,
    type: "paragraph",
    children,
    marks: marks ?? {},
  } satisfies ParagraphNodeTDO;
}

export interface ParagraphNode extends Node {
  type: "paragraph";
  children: WrappedSignal<Node[]>;
  marks: WrappedSignal<MarkMap>;
}

export function create_ParagraphNode(
  id: string,
  children: Node[],
  marks?: MarkMap
) {
  return create_Node<ParagraphNode>({
    id,
    type: "paragraph",
    children: createSignal(children, {
      equals: false,
    }),
    marks: createSignal<MarkMap>(marks ?? {}),
  });
}

export const ParagraphRenderer: NodeRenderer<ParagraphNode> = (props) => {
  const { renderer_manager, node, editor } = props;

  let container!: WithMixEditorNode<HTMLParagraphElement>;
  onMount(() => {
    container.mixed_node = node;
  });

  createEffect(() => {
    console.log("paragraph:children", node.children.get());
  });

  return (
    <p class="_paragraph" ref={container}>
      {node.children.get().map((child) =>
        renderer_manager.get(child.type)({
          renderer_manager,
          node: child,
          editor,
        })
      )}
    </p>
  );
};

export function paragraph() {
  return {
    id: "paragraph",
    init: async (ctx: MixEditorPluginContext) => {
      const editor = ctx.editor;
      const {
        node_manager,
        mark_manager,
        operation_manager,
        node_tdo_manager,
      } = editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      node_manager.set_tag("paragraph", ["block", "inline_container"]);
      node_manager.set_mergeable_into_tags("paragraph", ["block_container"]);

      node_tdo_manager.register_handler(
        "paragraph",
        "to_node",
        async (_, tdo) => {
          const dtdo = tdo as ParagraphNodeTDO;
          // TODO：缺失对没有注册或加载失败的节点的处理
          const children = (
            await Promise.all(
              dtdo.children.map((child) =>
                node_tdo_manager.execute_handler("to_node", child)
              )
            )
          ).filter((child) => child !== undefined) as Node[];
          const paragraph_node = node_manager.create_node(
            create_ParagraphNode,
            children,
            await load_mark_map(node_tdo_manager, dtdo.marks)
          );
          children.forEach((child) => {
            node_manager.set_parent(child, paragraph_node);
          });
          return paragraph_node;
        }
      );

      node_manager.register_handlers("paragraph", {
        to_tdo: async (_, node) => {
          const paragraph_node = node as ParagraphNode;
          return {
            id: paragraph_node.id,
            type: "paragraph",
            children: (
              await Promise.all(
                paragraph_node.children
                  .get()
                  .map((child) => node_manager.execute_handler("to_tdo", child))
              )
            ).filter((child) => child !== undefined),
            marks: await save_mark_map(
              mark_manager,
              paragraph_node.marks.get()
            ),
          } satisfies ParagraphNodeTDO;
        },

        slice: (_, node, start, end) => {
          return node_manager.create_node(
            create_ParagraphNode,
            node.children.get().slice(start, end)
          );
        },

        get_children_count: (_, node) => {
          return node.children.get().length;
        },

        get_child: (_, node, index) => {
          return node.children.get()[index] as any;
        },

        get_index_of_child: (_, node, child) => {
          return node.children.get().indexOf(child);
        },

        insert_children: async (_, node, index, children) => {
          console.log("paragraph:insert_children", node, index, children);

          const children_count = node.children.get().length;
          if (index > children_count) {
            index = children_count;
          }
          const new_children: Node[] = [];
          for (const child of children) {
            if (child.type === "node_ref") {
              const node_ref = child as NodeRefTDO;
              new_children.push(node_manager.get_node_by_id(node_ref.node_id)!);
            } else {
              new_children.push(
                await node_tdo_manager.execute_handler("to_node", child)!
              );
            }
          }

          for (const child of new_children) {
            node_manager.set_parent(child, node);
          }

          const self_children = node.children.get();
          self_children.splice(index, 0, ...new_children);

          console.log("paragraph:insert_children", self_children);
          node.children.set(self_children);
        },

        delete_children: paragraph_delete_children,

        // handle_insert_nodes: (_, node, insert_index, nodes_to_insert, from) => {
        //   return InsertNodesDecision.Reject;
        // },

        "bv:get_child_caret": (_, node, child_index) => {
          const children = node.children.get();
          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();
          if (child_index === children.length) {
            // 最后一个子节点
            const last_child = children[children.length - 1] as any;
            const last_child_context = node_manager.get_context(last_child)!;
            const rects = last_child_context["bv:html_node"]!.getClientRects();
            const last_rect = rects[rects.length - 1];
            return {
              x: last_rect.right - root_rect.left,
              y: last_rect.top - root_rect.top,
              height: last_rect.height,
            };
          } else {
            const child = children[child_index] as any;
            const child_context = node_manager.get_context(child)!;
            const rects = child_context["bv:html_node"]!.getClientRects();
            const rect = rects[0];
            return {
              x: rect.left - root_rect.left,
              y: rect.top - root_rect.top,
              height: rect.height,
            };
          }
        },
      });

      node_manager.register_strategies("paragraph", {
        caret_navigate: create_DynamicStrategy((_, node, context) => {
          let { from, direction, src } = context;

          const children_count = node.children.get().length;
          const to_prev = direction === NavigateDirection.Prev;

          if ((to_prev && from > children_count) || (!to_prev && from < 0)) {
            // 进入时超出该方向的首边界，跳转至首边界
            return CaretNavigateDecision.Enter(to_prev ? children_count : 0);
          } else if (src === CaretNavigateSource.Child) {
            // 从子区域跳入，跳转至指定索引
            return CaretNavigateDecision.Enter(
              from + (direction === NavigateDirection.Prev ? 0 : 1)
            );
          } else if (src === CaretNavigateSource.Parent) {
            // 从父区域跳入
            if ((to_prev && from < 0) || (!to_prev && from >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateDecision.Skip;
            }
            return CaretNavigateDecision.Enter(from);
          } else {
            from += direction === NavigateDirection.Prev ? -1 : 0;
            // 从自身索引移动，跳入子区域
            if ((to_prev && from < 0) || (!to_prev && from >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateDecision.Skip;
            }

            // 跳入子区域
            return CaretNavigateDecision.EnterChild(from);
          }
        }),

        delete_from_point: create_DynamicStrategy((_, node, context) => {
          const children = node.children.get();
          const { from, direction } = context;
          const to_prev = direction === NavigateDirection.Prev;
          if (to_prev) {
            if (from <= 0) return DeleteFromPointDecision.Skip;
            return DeleteFromPointDecision.EnterChild(from - 1);
          } else {
            if (from >= children.length) return DeleteFromPointDecision.Skip;
            return DeleteFromPointDecision.EnterChild(from);
          }
        }),

        delete_range: paragraph_delete_range_strategy,

        merge_node: create_DynamicStrategy(async (_, node, context) => {
          const { target } = context;
          if (target.type !== "paragraph") {
            return MergeNodeDecision.Reject;
          }

          const generate_insert_children_operation = () => [
            operation_manager.create_operation(
              create_InsertChildrenOperation,
              node.id,
              node.children.get().length,

              (target as ParagraphNode).children
                .get()
                .map((child) =>
                  node_tdo_manager.create_tdo(create_NodeRefTDO, child.id)
                )
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

        "bv:pointer_down": create_DynamicStrategy(async (_, node, context) => {
          const { event } = context;
          if (event.context.bv_handled) return BvPointerEventDecision.none;
          const raw_event = event.raw;

          const caret_pos = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          );
          if (!caret_pos) return BvPointerEventDecision.none;

          const children = node.children.get();

          // 分发给对应的子节点进行处理
          for (const child of children) {
            const child_context = node_manager.get_context(child)!;
            const child_element = child_context["bv:html_node"]!;

            if (is_ancestor(caret_pos.node, child_element)) {
              // 交给子节点处理
              await node_manager.execute_handler(
                "bv:handle_delegated_pointer_down",
                child,
                event,
                caret_pos
              );
              break;
            }
          }

          return BvPointerEventDecision.none;
        }),

        "bv:draw_selected_mask": create_DynamicStrategy((_, node, context) => {
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed")
            return BvDrawSelectedMaskDecision.Skip;
          return BvDrawSelectedMaskDecision.Enter;
        }),
      });

      // 注册渲染器
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("paragraph", ParagraphRenderer);
    },
    dispose: () => {},
  };
}
