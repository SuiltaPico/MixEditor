import { Compo, MixEditor, ToTdoCb, FromTdoCb } from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";

export class DocCodeInlineCompo implements Compo {
  static type = "doc:code_inline" as const;
  get type() {
    return DocCodeInlineCompo.type;
  }
}

export function register_DocCodeInlineCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocCodeInlineCompo.type, {
    [ToTdoCb]() {
      return {
        type: DocCodeInlineCompo.type,
      };
    },
    [FromTdoCb]() {
      return new DocCodeInlineCompo();
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_code = ecs.get_compo(ent_id, DocCodeInlineCompo.type);
      const src_code = ecs.get_compo(src_id, DocCodeInlineCompo.type);

      if (ent_code && src_code) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
