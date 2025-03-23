import { EntChildCompo, MixEditor } from "@mixeditor/core";
import { DOMCaretPos, get_caret_pos_from_point } from "../common";
import { BvRenderableCompo } from "./renderable";

export function bv_forward_pointer_event(
  editor: MixEditor,
  ent_id: string,
  event: PointerEvent,
  caret_pos?: DOMCaretPos
) {
  const { ecs } = editor;
  const ent_child_compo = ecs.get_compo(ent_id, EntChildCompo.type);
  if (!ent_child_compo) return;

  if (!caret_pos) {
    caret_pos = get_caret_pos_from_point(event.clientX, event.clientY);
    if (!caret_pos) return;
  }

  for (const child_id of ent_child_compo.children.get()) {
    const child_renderable = ecs.get_compo(child_id, BvRenderableCompo.type);
    if (!child_renderable?.render_result) continue;
    if (child_renderable.render_result.node.contains(caret_pos.node)) {
      child_renderable.forward_pointer_event({
        editor,
        ent_id: child_id,
        pos: caret_pos,
        event,
      });
      break;
    }
  }
}
