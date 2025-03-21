import { Compo, MixEditor, ToTdoCb, FromTdoCb } from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";

export class DocTextBoldCompo implements Compo {
  static type = "doc:text_bold" as const;
  get type() {
    return DocTextBoldCompo.type;
  }
}

export function register_DocTextBoldCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextBoldCompo.type, {
    [ToTdoCb]() {
      return {
        type: DocTextBoldCompo.type,
      };
    },
    [FromTdoCb]() {
      return new DocTextBoldCompo();
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_bold = ecs.get_compo(ent_id, DocTextBoldCompo.type);
      const src_bold = ecs.get_compo(src_id, DocTextBoldCompo.type);

      if ((ent_bold && src_bold) || (!ent_bold && !src_bold)) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
