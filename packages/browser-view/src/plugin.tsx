import { EventHandler, Events, MixEditorPluginContext } from "@mixeditor/core";
import { render } from "solid-js/web";
import { BvSelection } from "./BvSelection";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { EditorRenderer } from "./renderer/EditorRenderer";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
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

      function generate_handler<THandlerName extends keyof Events>(
        handler_name: THandlerName
      ) {
        return async (
          params: Parameters<EventHandler<Events[THandlerName]>>[0]
        ) => {
          const target = (params.event as any).raw
            .target as WithMixEditorNode<HTMLElement>;
          let current = target;

          // 向上查找最近的带有 mixed_node 属性的元素
          while (current && !current.mixed_node) {
            current = current.parentElement!;
          }

          if (!current) return;

          let current_node = current.mixed_node;
          while (current_node) {
            // 执行节点的指针事件处理
            const result = await editor.node_manager.execute_handler(
              handler_name,
              current_node,
              (params.event as any).raw as any
            );

            if (result.type === "handled") {
              return;
            }
            current_node =
              editor.node_manager.get_context(current_node)!.parent;
          }
        };
      }

      async function handle_pointer_down(
        params: Parameters<EventHandler<Events["bv:pointer_down"]>>[0]
      ) {
        const target = params.event.raw
          .target as WithMixEditorNode<HTMLElement>;
        let current = target;

        // 向上查找最近的带有 mixed_node 属性的元素
        while (current && !current.mixed_node) {
          current = current.parentElement!;
        }

        if (!current) return;

        let current_node = current.mixed_node;
        while (current_node) {
          // 执行节点的指针事件处理
          const result = await editor.node_manager.execute_handler(
            "bv:handle_pointer_down",
            current_node,
            params.event.raw
          );

          if (result.type === "handled") {
            return;
          }
          current_node = editor.node_manager.get_context(current_node)!.parent;
        }
      }

      async function handle_pointer_up(
        params: Parameters<EventHandler<Events["bv:pointer_up"]>>[0]
      ) {
        // TODO: 同上
      }

      async function handle_pointer_move(
        params: Parameters<EventHandler<Events["bv:pointer_move"]>>[0]
      ) {
        // TODO: 同上
      }

      // 责任链注册
      ctx.editor.event_manager.add_handler(
        "bv:pointer_down",
        handle_pointer_down
      );
      ctx.editor.event_manager.add_handler("bv:pointer_up", handle_pointer_up);
      ctx.editor.event_manager.add_handler(
        "bv:pointer_move",
        handle_pointer_move
      );

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

        // 导出责任链事件处理器
        handle_pointer_down,
        handle_pointer_up,
        handle_pointer_move,
      };
    },
    dispose: () => {
      renderer_disposer();
    },
  };
}
