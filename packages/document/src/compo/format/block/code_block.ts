import { Compo, MixEditor, ToTdoCb, FromTdoCb } from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";

export class DocCodeBlockCompo implements Compo {
  static type = "doc:code_block" as const;
  get type() {
    return DocCodeBlockCompo.type;
  }
}

export function register_DocCodeBlockCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocCodeBlockCompo.type, {
    [ToTdoCb]() {
      return {
        type: DocCodeBlockCompo.type,
      };
    },
    [FromTdoCb]() {
      return new DocCodeBlockCompo();
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_code = ecs.get_compo(ent_id, DocCodeBlockCompo.type);
      const src_code = ecs.get_compo(src_id, DocCodeBlockCompo.type);

      if (ent_code && src_code) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
