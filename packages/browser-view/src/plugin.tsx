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

        if (current) {
          const node = current.mixed_node!;
          if (!node) return;

          // 执行节点的指针事件处理
          const result = await editor.node_manager.execute_handler(
            "bv:handle_pointer_down",
            node,
            params.event.raw
          );

          if (result.type === "handled") {
            return;
          }
        }
        // TODO: 向上查找寻找最近的带有 mixed_node 属性的元素
        // TODO: 如果找到，则以 mixed_node 开启责任链循环，
        // TODO: 不停向责任链的元素执行 "bv:handle_pointer_down" 行为，直到找到一个返回结果的 type 是 handled 的节点
        // TODO: 如果直达最顶层，则忽略。现在有一个问题，节点并不知道自己的父节点，所以不知道怎么做
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
