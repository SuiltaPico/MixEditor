import {
  EntChildCompo,
  MixEditor,
  TreeDeleteChildrenOp,
} from "@mixeditor/core";
import {
  DocRangeDeleteCb,
  RangeDeleteDecision
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
  });
}
