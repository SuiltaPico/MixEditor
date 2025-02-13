import { MaybePromise } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

export const PointerEventDecision = {
  none: {
    type: "none",
  },
  stop_propagation: {
    type: "stop_propagation",
  },
} as const;

export type PointerEventDecision =
  | (typeof PointerEventDecision)[keyof typeof PointerEventDecision];

export type PointerEventHandler = (
  editor: MixEditor,
  node: Node,
  element: HTMLElement,
  event: PointerEvent
) => MaybePromise<PointerEventDecision>;

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
