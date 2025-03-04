import { Rect } from "@mixeditor/common";

/** 选区绘制决策。 */
export const BvRenderSelectionDecision = {
  /** 跳过，不绘制选区。 */
  Skip: {
    type: "skip",
  },
  /** 进入自己的逐个子节点。 */
  Enter: {
    type: "enter",
  },
  /** 默认行为。（直接在当前节点绘制选区） */
  Render: (rects: Rect[]) => ({
    type: "render" as const,
    /** 选区范围。 */
    rects,
  }),
} as const;

/** 选区绘制决策。 */
export type BvRenderSelectionDecision =
  | {
      type: "skip";
    }
  | {
      type: "enter";
    }
  | {
      type: "render";
      rects: Rect[];
    };

export interface BvRenderSelectionContext {
  from: number;
  to: number;
}
