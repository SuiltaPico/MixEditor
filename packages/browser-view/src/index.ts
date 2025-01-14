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

declare module "@mixeditor/core" {
  interface Events {
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
  }
  interface NodeBehavior {
    "bv:pointer_down": PointerEventBehavior;
    "bv:pointer_up": PointerEventBehavior;
    "bv:pointer_move": PointerEventBehavior;
  }
}
