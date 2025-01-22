import { MixEditor } from "@mixeditor/core";
import { MaybePromise } from "@mixeditor/common";

export * from "./renderer/NodeRenderer";
export * from "./renderer/NodeRendererManager";
export * from "./plugin";
export * from "./renderer/EditorRenderer";

export type PointerBehaviorResult =
  | {
      type: "skip";
    }
  | {
      type: "handled";
    };

export type PointerEventBehavior = (
  editor: MixEditor,
  node: Node,
  event: PointerEvent
) => MaybePromise<PointerBehaviorResult>;

// 扩展主模块
declare module "@mixeditor/core" {
  interface Events {
    // --- 指针事件 ---
    "bv:pointer_down": {
      event_type: "bv:pointer_down";
      raw: PointerEvent;
    };
    "bv:pointer_up": {
      event_type: "bv:pointer_up";
      raw: PointerEvent;
    };
    "bv:pointer_move": {
      event_type: "bv:pointer_move";
      raw: PointerEvent;
    };

    // TODO：添加更多事件
  }

  interface NodeHandlerMap {
    "bv:handle_pointer_down": PointerEventBehavior;
    "bv:handle_pointer_up": PointerEventBehavior;
    "bv:handle_pointer_move": PointerEventBehavior;
    // TODO：添加更多行为
  }
}
