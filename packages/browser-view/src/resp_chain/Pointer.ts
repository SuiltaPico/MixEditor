import { MaybePromise } from "@mixeditor/common";
import { EventToEventForEmit, MixEditor } from "@mixeditor/core";
import { DOMCaretPos } from "../common/dom";

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
  event: EventToEventForEmit<BvPointerEvent>
) => MaybePromise<PointerEventDecision>;

type BvPointerBaseEvent = {
  raw: PointerEvent;
  context: {
    bv_handled?: boolean;
  };
};

export interface BvPointerDownEvent extends BvPointerBaseEvent {
  type: "bv:pointer_down";
}

export interface BvPointerUpEvent extends BvPointerBaseEvent {
  type: "bv:pointer_up";
}

export interface BvPointerMoveEvent extends BvPointerBaseEvent {
  type: "bv:pointer_move";
}

export type BvPointerEvent =
  | BvPointerDownEvent
  | BvPointerUpEvent
  | BvPointerMoveEvent;

export type BvPointerEventHandlerName =
  | "bv:handle_pointer_down"
  | "bv:handle_pointer_up"
  | "bv:handle_pointer_move";

export type BvDelegatedPointerEventHandler = (
  editor: MixEditor,
  node: Node,
  event: EventToEventForEmit<BvPointerEvent>,
  caret_pos: DOMCaretPos
) => MaybePromise<void>;
