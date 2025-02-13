import { Rect } from "@mixeditor/common";

export type SelectedMaskDecisionSkip = {
  type: "skip";
};

export type SelectedMaskDecisionEnter = {
  type: "enter";
};

export type SelectedMaskDecisionRender = {
  type: "render";
  /** 选区范围。 */
  rects: Rect[];
};

/** 选区绘制决策。 */
export const SelectedMaskDecision = {
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
export type SelectedMaskDecision =
  | SelectedMaskDecisionSkip
  | SelectedMaskDecisionEnter
  | SelectedMaskDecisionRender;
