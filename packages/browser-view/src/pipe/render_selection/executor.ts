import { Rect } from "@mixeditor/common";
import { get_actual_child_compo, MixEditor } from "@mixeditor/core";
import { BvRenderableCompo, BvRenderSelectionDecision } from "../../compo";

async function get_render_decision(
  editor: MixEditor,
  ent_id: string,
  from: number,
  to: number,
  root_rect: Rect
): Promise<BvRenderSelectionDecision> {
  const ent_ctx = editor.ecs;
  const renderable = ent_ctx.get_compo(ent_id, BvRenderableCompo.type);
  if (!renderable) return BvRenderSelectionDecision.Ignore;
  return renderable.get_render_selection_policy({
    editor,
    ent_id,
    from,
    to,
    root_rect,
  });
}

export async function execute_render_selection(
  editor: MixEditor,
  ent_id: string,
  from: number,
  to: number,
  root_rect: Rect,
  rects: Rect[]
) {
  const ent_ctx = editor.ecs;
  const decision = await get_render_decision(
    editor,
    ent_id,
    from,
    to,
    root_rect
  );

  if (decision.type === "ignore") return;
  else if (decision.type === "traverse") {
    const actual_child_compo = get_actual_child_compo(ent_ctx, ent_id);
    if (!actual_child_compo) return;

    const length = actual_child_compo.count();
    if (to > length) {
      to = length;
    }
    let promises: Promise<void>[] = [];

    for (let i = from; i < to; i++) {

      const child_ent_id = actual_child_compo.at(i);
      if (!child_ent_id) continue;

      // 全选子节点
      promises.push(
        execute_render_selection(
          editor,
          child_ent_id,
          0,
          Number.MAX_SAFE_INTEGER,
          root_rect,
          rects
        )
      );
    }
    await Promise.all(promises);
  } else if (decision.type === "draw_rect") {
    rects.push(...decision.rects);
  }
}
