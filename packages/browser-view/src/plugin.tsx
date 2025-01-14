import { MixEditorPluginContext } from "@mixeditor/core";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
import { render } from "solid-js/web";
import { EditorRenderer } from "./renderer/EditorRenderer";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { BvSelection } from "./BvSelection";
import { WithMixEditorNode } from "./renderer/NodeRenderer";

export interface BrowserViewPluginResult {
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}

export function browser_view(props: { element: HTMLElement }) {
  let renderer_disposer: () => void;
  return {
    id: "browser-view",
    init: (ctx: MixEditorPluginContext) => {
      const { editor } = ctx;

      // 创建渲染器管理器
      const renderer_manager = new NodeRendererManager();
      renderer_manager.register("document", DocumentRenderer);

      // 创建选区管理器
      const bv_selection = new BvSelection(ctx.editor);

      // 责任链注册
      ctx.editor.event_manager.add_handler(
        "bv:pointer_down",
        async ({ event, wait_dependencies }) => {
          await wait_dependencies();
          const pointer_event = event.raw;
          const target = pointer_event.target as WithMixEditorNode<Node>;
          const node = target.mixed_node;
          if (!node) {
            // continue，继续往上找，直到遇到 renderer_manager.editor_root
          }
          const result = await editor.node_manager.execute_behavior(
            "bv:pointer_down",
            node,
            pointer_event
          );
          if (result.type === "skip") {
            // continue，继续往上调用 node_manager.execute_behavior，直到找不到元素的父节点或者有一个返回结果的 type 是 handled
          }
        }
      );
      ctx.editor.event_manager.add_handler("bv:pointer_up", (e) => {});
      ctx.editor.event_manager.add_handler("bv:pointer_move", (e) => {});

      // 渲染编辑器
      renderer_disposer = render(
        () => (
          <EditorRenderer
            editor={ctx.editor}
            renderer_manager={renderer_manager}
            bv_selection={bv_selection}
          />
        ),
        props.element
      );

      return {
        renderer_manager,
        bv_selection,
      };
    },
    dispose: () => {
      renderer_disposer();
    },
  };
}
