import { Rect } from "@mixeditor/common";

export type BvDrawSelectedMaskDecisionSkip = {
  type: "skip";
};

export type BvDrawSelectedMaskDecisionEnter = {
  type: "enter";
};

export type BvDrawSelectedMaskDecisionRender = {
  type: "render";
  /** 选区范围。 */
  rects: Rect[];
};

/** 选区绘制决策。 */
export const BvDrawSelectedMaskDecision = {
  /** 跳过，不绘制选区。 */
  skip: {
    type: "skip",
  },
  /** 进入自己的逐个子节点。 */
  enter: {
    type: "enter",
  },
  /** 默认行为。（直接在当前节点绘制选区） */
  render: (rects: Rect[]) => ({
    type: "render" as const,
    /** 选区范围。 */
    rects,
  }),
} as const;

/** 选区绘制决策。 */
export type BvDrawSelectedMaskDecision =
  | BvDrawSelectedMaskDecisionSkip
  | BvDrawSelectedMaskDecisionEnter
  | BvDrawSelectedMaskDecisionRender;

export interface BvDrawSelectedMaskStrategyConfig {
  context: {
    from: number;
    to: number;
  };
  decision: BvDrawSelectedMaskDecision;
}
