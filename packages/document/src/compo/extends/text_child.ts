import {
  MixEditor,
  TextChildCompo,
  TreeChildrenDeleteOp,
} from "@mixeditor/core";
import { TextEntType } from "../../ent";
import { DocRangeDeleteCb, RangeDeleteDecision } from "../../pipe";

export function register_TextChildCompo_doc_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextEntType, {
    async [DocRangeDeleteCb](params) {
      const { it, start, end, tx, ex_ctx, ent_id } = params;
      const { op } = ex_ctx;
      const self = it as TextChildCompo;
      const text = self.content.get();

      if (start <= 0 && end >= text.length) {
        return RangeDeleteDecision.DeleteSelf;
      } else {
        await tx.execute(
          new TreeChildrenDeleteOp(op.gen_id(), ent_id, start, end)
        );
        return RangeDeleteDecision.Done({});
      }
    },
  });
}
