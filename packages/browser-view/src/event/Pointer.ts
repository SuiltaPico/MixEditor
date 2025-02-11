import { MaybePromise } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

export const PointerEventResult = {
  skip: {
    type: "skip",
  },
  handled: {
    type: "handled",
  },
} as const;

export type PointerEventResult =
  | (typeof PointerEventResult)["skip"]
  | (typeof PointerEventResult)["handled"];

export type PointerEventHandler = (
  editor: MixEditor,
  node: Node,
  element: HTMLElement,
  event: PointerEvent
) => MaybePromise<PointerEventResult>;

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
