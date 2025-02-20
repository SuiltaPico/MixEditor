import { MaybePromise } from "@mixeditor/common";
import {
  EventToEventForEmit,
  MixEditor,
  MixEditorEventManagerContext,
} from "@mixeditor/core";
import { DOMCaretPos } from "../common/dom";

export const BvPointerEventDecision = {
  none: {
    type: "none",
  },
  stop_propagation: {
    type: "stop_propagation",
  },
} as const;

export type BvPointerEventDecision =
  | (typeof BvPointerEventDecision)[keyof typeof BvPointerEventDecision];

export type BvPointerEventStrategyName =
  | "bv:pointer_down"
  | "bv:pointer_up"
  | "bv:pointer_move";

export interface BvPointerEventStrategyConfig {
  context: {
    element: HTMLElement;
    event: EventToEventForEmit<BvPointerEvent, MixEditorEventManagerContext>;
  };
  decision: BvPointerEventDecision;
}

export type BvPointerEventStrategyConfigMap = {
  [key in BvPointerEventStrategyName]: BvPointerEventStrategyConfig;
};

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

export type BvDelegatedPointerEventHandler = (
  editor: MixEditor,
  node: Node,
  event: EventToEventForEmit<BvPointerEvent, MixEditorEventManagerContext>,
  caret_pos: DOMCaretPos
) => MaybePromise<void>;
