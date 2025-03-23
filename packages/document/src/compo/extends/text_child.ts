import {
  MixEditor,
  TextChildCompo,
  TreeDeleteChildrenOp,
} from "@mixeditor/core";
import { TextEntType } from "../../ent";
import {
  DocInsertCb,
  DocRangeDeleteCb,
  InsertDecision,
  RangeDeleteDecision,
} from "../../pipe";

export function register_TextChildCompo_doc_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextChildCompo.type, {
    async [DocRangeDeleteCb](params) {
      const { it, start, end, tx, ex_ctx, ent_id } = params;
      const { op } = ex_ctx;
      const text = it.content.get();

      if (start <= 0 && end >= text.length) {
        return RangeDeleteDecision.DeleteSelf;
      } else {
        await tx.execute(
          new TreeDeleteChildrenOp(op.gen_id(), ent_id, start, end)
        );
        return RangeDeleteDecision.Done({});
      }
    },
    async [DocInsertCb](params) {
      const { it, items } = params;

      let left_index = 0;
      for (; left_index < items.length; left_index++) {
        const item = items[left_index];
        const text_child_compo = ecs.get_compo(item, it.type);
        if (!text_child_compo) {
          break;
        }
      }

      let right_index = items.length - 1;
      for (; right_index > left_index; right_index--) {
        const item = items[right_index];
        const text_child_compo = ecs.get_compo(item, it.type);
        if (!text_child_compo) {
          break;
        }
      }

      if (left_index >= right_index) {
        return InsertDecision.Accept();
      }

      return InsertDecision.PartialAccept({
        rejected_from: left_index,
        rejected_to: right_index,
      });
    },
  });
}
