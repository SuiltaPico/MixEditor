import {
  NavigateDirection,
  DefaultItemType,
  EventHandler,
  MixEditorPluginContext,
  MixEditorEventManagerContext,
  create_DeleteSelectedEvent,
} from "@mixeditor/core";
import { render } from "solid-js/web";
import {
  BvPointerEvent,
  BvPointerEventHandlerName,
  PointerEventDecision,
  SelectedMaskDecision,
} from ".";
import { BvSelection } from "./BvSelection";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { EditorRenderer } from "./renderer/EditorRenderer";
import { WithMixEditorNode } from "./renderer/NodeRenderer";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
import { BvKeyDownEvent } from "./resp_chain/Key";

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
      const node_manager = editor.node_manager;

      // 创建渲染器管理器
      const renderer_manager = new NodeRendererManager();
      renderer_manager.register("document", DocumentRenderer);

      // 创建选区管理器
      const bv_selection = new BvSelection(ctx.editor);

      function generate_handler<TEvent extends BvPointerEvent>(
        handler_name: BvPointerEventHandlerName
      ) {
        return async (
          params: Parameters<
            EventHandler<TEvent, MixEditorEventManagerContext>
          >[0]
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

          // 向上开始传播
          while (current_node) {
            // 执行节点的指针事件处理
            const result = await node_manager.execute_handler(
              handler_name,
              current_node,
              current,
              // @ts-ignore
              params.event
            )!;

            if (result.type === "stop_propagation") {
              return;
            }
            current_node = node_manager.get_parent(current_node);
          }
        };
      }

      const handle_pointer_down = generate_handler("bv:handle_pointer_down");
      const handle_pointer_up = generate_handler("bv:handle_pointer_up");
      const handle_pointer_move = generate_handler("bv:handle_pointer_move");

      async function handle_key_down(
        params: Parameters<
          EventHandler<BvKeyDownEvent, MixEditorEventManagerContext>
        >[0]
      ) {
        const event = params.event.raw;
        if (!event.ctrlKey) {
          if (event.key === "ArrowLeft") {
            await editor.selection.navigate(NavigateDirection.Prev);
          } else if (event.key === "ArrowRight") {
            await editor.selection.navigate(NavigateDirection.Next);
          }
        } else if (event.ctrlKey) {
          if (event.key === "z") {
            await editor.history_manager.undo();
          } else if (event.key === "y") {
            await editor.history_manager.redo();
          }
        }

        if (event.key === "Backspace") {
          await editor.event_manager.emit(
            create_DeleteSelectedEvent(NavigateDirection.Prev)
          );
        } else if (event.key === "Delete") {
          await editor.event_manager.emit(
            create_DeleteSelectedEvent(NavigateDirection.Next)
          );
        }
      }

      // 责任链注册
      editor.event_manager.add_handler("bv:pointer_down", handle_pointer_down);
      editor.event_manager.add_handler("bv:pointer_up", handle_pointer_up);
      editor.event_manager.add_handler("bv:pointer_move", handle_pointer_move);
      editor.event_manager.add_handler("bv:key_down", handle_key_down);

      const default_handler = () => PointerEventDecision.none;
      node_manager.register_handlers(DefaultItemType, {
        "bv:handle_pointer_down": default_handler,
        "bv:handle_pointer_up": default_handler,
        "bv:handle_pointer_move": default_handler,

        "bv:get_child_caret": () => {
          return undefined;
        },
      });

      node_manager.register_handlers("document", {
        "bv:handle_selected_mask": () => {
          return SelectedMaskDecision.enter;
        },
      });

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
