import {
  EntChildCompo,
  MixEditor,
  TreeDeleteChildrenOp,
} from "@mixeditor/core";
import { ParagraphEntType, TextEntType } from "../../ent";
import {
  DocInsertCb,
  DocRangeDeleteCb,
  InsertDecision,
  RangeDeleteDecision,
} from "../../pipe";

export function register_EntChildCompo_doc_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(EntChildCompo.type, {
    async [DocRangeDeleteCb](params) {
      const { it, start, end, tx, ex_ctx, ent_id } = params;
      const { op } = ex_ctx;
      const self = it as EntChildCompo;
      const text = self.children.get();

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
      const { it, ent_id, items, ex_ctx } = params;
      const ent_type = ex_ctx.ecs.get_ent(ent_id)?.type;

      let left_index = 0;
      for (; left_index < items.length; left_index++) {
        const item = items[left_index];
        const ent_child_compo = ecs.get_compo(item, it.type);
        if (ent_type === ParagraphEntType && ent_child_compo) {
          break;
        }
      }

      let right_index = items.length - 1;
      for (; right_index > left_index; right_index--) {
        const item = items[right_index];
        const ent_child_compo = ecs.get_compo(item, it.type);
        if (ent_type === ParagraphEntType && ent_child_compo) {
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
