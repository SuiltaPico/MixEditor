import { Rect } from "@mixeditor/common";
import { Ent, MixEditor } from "@mixeditor/core";

/** 选区绘制决策。 */
export const BvRenderSelectionDecision = {
  /** 跳过，不绘制选区。
   * @default
   */
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

export async function execute_render_selection(
  editor: MixEditor,
  ent: Ent,
  from: number,
  to: number,
  rects: Rect[]
) {
  const ent_ctx = editor.ent;
  const decision = await ent_ctx.exec_behavior(
    ent,
    "bv:handle_render_selection",
    {
      from,
      to,
    }
  );
  if (!decision || decision.type === "skip") return;
  else if (decision.type === "enter") {
    const length = await ent_ctx.exec_behavior(ent, "tree:length", {})!;
    if (to > length) {
      to = length - 1;
    }
    let promises: Promise<void>[] = [];
    for (let i = from; i <= to; i++) {
      // 全选子节点
      promises.push(
        execute_render_selection(
          editor,
          (await ent_ctx.exec_behavior(ent, "tree:child_at", {
            index: i,
          })) as Ent,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    await Promise.all(promises);
  } else if (decision.type === "render") {
    rects.push(...decision.rects);
  }
}
