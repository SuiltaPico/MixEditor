import {
  BrowserViewPluginResult,
  NodeRenderer,
  PointerEventDecision,
  SelectedMaskDecision,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  AnyTDO,
  CaretNavigateEnterDecision,
  CaretNavigateFrom,
  MixEditorPluginContext,
  Node,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";
import { CaretNavigateDirection } from "@mixeditor/core";

declare module "@mixeditor/core" {
  interface AllNodes {
    paragraph: ParagraphNode;
  }
}

export interface ParagraphNodeTDO extends TransferDataObject {
  type: "paragraph";
  children: AnyTDO[];
}

export class ParagraphNode implements Node {
  type = "paragraph" as const;
  children: WrappedSignal<Node[]>;
  constructor(children: Node[]) {
    this.children = createSignal(children);
  }
}

export const ParagraphRenderer: NodeRenderer<ParagraphNode> = (props) => {
  const { renderer_manager, node, editor } = props;

  let container!: WithMixEditorNode<HTMLParagraphElement>;
  onMount(() => {
    container.mixed_node = node;
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
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      editor.saver.register_loader("paragraph", async (_tdo) => {
        const tdo = _tdo as ParagraphNodeTDO;
        const children = await Promise.all(
          tdo.children.map((child) => editor.saver.load_node_from_tdo(child))
        );
        const paragraph_node = new ParagraphNode(children);
        children.forEach((child) => {
          editor.node_manager.set_parent(child, paragraph_node);
        });
        return paragraph_node;
      });

      editor.node_manager.register_handlers("paragraph", {
        save: async (_, node) => {
          const paragraph_node = node as ParagraphNode;
          return {
            type: "paragraph",
            children: (
              await Promise.all(
                paragraph_node.children
                  .get()
                  .map((child) =>
                    editor.node_manager.execute_handler("save", child)
                  )
              )
            ).filter((child) => child !== undefined),
          } satisfies ParagraphNodeTDO;
        },
        slice: (_, node, start, end) => {
          return new ParagraphNode(node.children.get().slice(start, end));
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
        caret_navigate_enter: (_, node, to, direction, from) => {
          const children_count = node.children.get().length;
          const to_prev = direction === CaretNavigateDirection.Prev;

          if ((to_prev && to > children_count) || (!to_prev && to < 0)) {
            // 进入时超出该方向的首边界，跳转至首边界
            return CaretNavigateEnterDecision.enter(
              to_prev ? children_count : 0
            );
          } else if (from === CaretNavigateFrom.Child) {
            // 从子区域跳入，跳转至指定索引
            return CaretNavigateEnterDecision.enter(
              to + (direction === CaretNavigateDirection.Prev ? 0 : 1)
            );
          } else if (from === CaretNavigateFrom.Parent) {
            // 从父区域跳入
            if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateEnterDecision.skip;
            }
            return CaretNavigateEnterDecision.enter(to);
          } else {
            to += direction === CaretNavigateDirection.Prev ? -1 : 0;
            // 从自身索引移动，跳入子区域
            if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
              // 超出该方向的尾边界，则跳过
              return CaretNavigateEnterDecision.skip;
            }

            // 跳入子区域
            return CaretNavigateEnterDecision.enter_child(to);
          }
        },
        "bv:handle_pointer_down": (_, node) => {
          // TODO：搜索 y 轴位置最近的子节点，并触发它的 pointer_down 事件。
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
            const last_child_context =
              editor.node_manager.get_context(last_child)!;
            const rects = last_child_context["bv:html_node"]!.getClientRects();
            const last_rect = rects[rects.length - 1];
            return {
              x: last_rect.right - root_rect.left,
              y: last_rect.top - root_rect.top,
              height: last_rect.height,
            };
          } else {
            const child = children[child_index] as any;
            const child_context = editor.node_manager.get_context(child)!;
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
