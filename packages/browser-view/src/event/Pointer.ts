import { MaybePromise } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

export const PointerBehaviorResult = {
  skip: {
    type: "skip",
  },
  handled: {
    type: "handled",
  },
} as const;

export type PointerBehaviorResult =
  | (typeof PointerBehaviorResult)["skip"]
  | (typeof PointerBehaviorResult)["handled"];

export type PointerEventHandler = (
  editor: MixEditor,
  node: Node,
  element: HTMLElement,
  event: PointerEvent
) => MaybePromise<PointerBehaviorResult>;

export type BvPointerDownEvent = {
  type: "bv:pointer_down";
  raw: PointerEvent;
};

export type BvPointerUpEvent = {
  type: "bv:pointer_up";
  raw: PointerEvent;
};

export type BvPointerMoveEvent = {
  type: "bv:pointer_move";
  raw: PointerEvent;
};

export type BvPointerEvent =
  | BvPointerDownEvent
  | BvPointerUpEvent
  | BvPointerMoveEvent;

export type BvPointerEventHandlerName =
  | "bv:handle_pointer_down"
  | "bv:handle_pointer_up"
  | "bv:handle_pointer_move";
