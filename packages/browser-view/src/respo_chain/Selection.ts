import { Rect } from "@mixeditor/common";

export type SelectedMaskResultSkip = {
  type: "skip";
};

export type SelectedMaskResultEnter = {
  type: "enter";
};

export type SelectedMaskResultRender = {
  type: "render";
  /** 选区范围。 */
  rect: Rect;
};

/** 选区绘制决策。 */
export const SelectedMaskResult = {
  /** 跳过，不绘制选区。 */
  skip: {
    type: "skip",
  },
  /** 进入自己的逐个子节点。 */
  enter: {
    type: "enter",
  },
  /** 默认行为。（直接在当前节点绘制选区） */
  render: (rect: Rect) => ({
    type: "render" as const,
    /** 选区范围。 */
    rect,
  }),
} as const;

/** 选区绘制决策。 */
export type SelectedMaskResult =
  | SelectedMaskResultSkip
  | SelectedMaskResultEnter
  | SelectedMaskResultRender;
