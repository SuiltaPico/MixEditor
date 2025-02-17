import {
  BrowserViewPluginResult,
  get_caret_pos_from_point,
  is_ancestor,
  NodeRenderer,
  PointerEventDecision,
  SelectedMaskDecision,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import {
  createSignal,
  get_closest_rect,
  WrappedSignal,
} from "@mixeditor/common";
import {
  AnyTDO,
  CaretNavigateEnterDecision,
  CaretNavigateFrom,
  MixEditorPluginContext,
  Node,
  TransferDataObject,
  DeleteFromPointDecision,
  DeleteRangeDecision,
  Operation,
  create_DeleteRangeOperation,
  paragraph_delete_children,
  paragraph_handle_delete_range,
  MergeNodeDecision,
  create_DeferredOperation,
  create_InsertChildrenOperation,
  create_NodeRefTDO,
  NodeRefTDO,
} from "@mixeditor/core";
import { createEffect, onMount } from "solid-js";
import { NavigateDirection } from "@mixeditor/core";

declare module "@mixeditor/core" {
  interface AllNodes {
    paragraph: ParagraphNode;
  }
}

export interface ParagraphNodeTDO extends TransferDataObject {
  type: "paragraph";
  children: AnyTDO[];
}

export function create_ParagraphNodeTDO(id: string, children: AnyTDO[]) {
  return {
    id,
    type: "paragraph",
    children,
  } satisfies ParagraphNodeTDO;
}

export interface ParagraphNode extends Node {
  type: "paragraph";
  children: WrappedSignal<Node[]>;
}

export function create_ParagraphNode(id: string, children: Node[]) {
  return {
    id,
    type: "paragraph",
    children: createSignal(children, {
      equals: false,
    }),
  } satisfies ParagraphNode;
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
      const { node_manager, operation_manager, saver } = editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      saver.register_loader("paragraph", async (_tdo) => {
        const tdo = _tdo as ParagraphNodeTDO;
        const children = await Promise.all(
          tdo.children.map((child) => saver.load_node_from_tdo(child))
        );
        const paragraph_node = node_manager.create_node(
          create_ParagraphNode,
          children
        );
        children.forEach((child) => {
          node_manager.set_parent(child, paragraph_node);
        });
        return paragraph_node;
      });

      node_manager.register_handlers("paragraph", {
        save: async (_, node) => {
          const paragraph_node = node as ParagraphNode;
          return {
            id: paragraph_node.id,
            type: "paragraph",
            children: (
              await Promise.all(
                paragraph_node.children
                  .get()
                  .map((child) => node_manager.execute_handler("save", child))
              )
            ).filter((child) => child !== undefined),
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

        insert_children: (_, node, index, children) => {
          console.log("paragraph:insert_children", node, index, children);

          const children_count = node.children.get().length;
          if (index > children_count) {
            index = children_count;
          }
          const new_children: Node[] = [];
          for (const child of children) {
            if (child.type === "node_ref") {
              const node_ref = child as NodeRefTDO;
              new_children.push(
                ...node_ref.node_ids.map(
                  (node_id) => node_manager.get_node_by_id(node_id)!
                )
              );
            } else {
              new_children.push(child);
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

        handle_caret_navigate: (_, node, to, direction, from) => {
          const children_count = node.children.get().length;
          const to_prev = direction === NavigateDirection.Prev;

          if ((to_prev && to > children_count) || (!to_prev && to < 0)) {
            // 进入时超出该方向的首边界，跳转至首边界
            return CaretNavigateEnterDecision.Enter(
              to_prev ? children_count : 0
            );
          } else if (from === CaretNavigateFrom.Child) {
            // 从子区域跳入，跳转至指定索引
            return CaretNavigateEnterDecision.Enter(
              to + (direction === NavigateDirection.Prev ? 0 : 1)
            );
          } else if (from === CaretNavigateFrom.Parent) {
            // 从父区域跳入
            if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateEnterDecision.Skip;
            }
            return CaretNavigateEnterDecision.Enter(to);
          } else {
            to += direction === NavigateDirection.Prev ? -1 : 0;
            // 从自身索引移动，跳入子区域
            if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateEnterDecision.Skip;
            }

            // 跳入子区域
            return CaretNavigateEnterDecision.EnterChild(to);
          }
        },

        handle_delete_from_point: (_, node, from, direction) => {
          const children = node.children.get();
          const to_prev = direction === NavigateDirection.Prev;
          if (to_prev) {
            if (from <= 0) return DeleteFromPointDecision.Skip;
            return DeleteFromPointDecision.EnterChild(from - 1);
          } else {
            if (from >= children.length) return DeleteFromPointDecision.Skip;
            return DeleteFromPointDecision.EnterChild(from);
          }
        },

        handle_delete_range: paragraph_handle_delete_range,

        handle_merge_node: async (_, node, target) => {
          if (target.type !== "paragraph") {
            return MergeNodeDecision.Reject;
          }

          return MergeNodeDecision.Done({
            operations: [
              operation_manager.create_operation(
                create_DeferredOperation,
                () => [
                  operation_manager.create_operation(
                    create_InsertChildrenOperation,
                    node.id,
                    node.children.get().length,
                    [
                      create_NodeRefTDO(
                        node_manager.generate_id(),
                        target.children.get().map((child) => child.id)
                      ),
                    ]
                  ),
                ]
              ),
            ],
          });
        },

        "bv:handle_pointer_down": async (_, node, element, event) => {
          if (event.context.bv_handled) return PointerEventDecision.none;
          const raw_event = event.raw;

          const caret_pos = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          );
          if (!caret_pos) return PointerEventDecision.none;

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

          return PointerEventDecision.none;
        },

        "bv:handle_selected_mask": (_, node, from, to) => {
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed") return SelectedMaskDecision.skip;
          return SelectedMaskDecision.enter;
        },

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

      // 注册渲染器
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("paragraph", ParagraphRenderer);
    },
    dispose: () => {},
  };
}
