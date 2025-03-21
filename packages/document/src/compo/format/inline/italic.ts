import { Compo, MixEditor, ToTdoCb, FromTdoCb } from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";

export class DocTextItalicCompo implements Compo {
  static type = "doc:text_italic" as const;
  get type() {
    return DocTextItalicCompo.type;
  }
}

export function register_DocTextItalicCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextItalicCompo.type, {
    [ToTdoCb]() {
      return {
        type: DocTextItalicCompo.type,
      };
    },
    [FromTdoCb]() {
      return new DocTextItalicCompo();
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_italic = ecs.get_compo(ent_id, DocTextItalicCompo.type);
      const src_italic = ecs.get_compo(src_id, DocTextItalicCompo.type);

      if ((ent_italic && src_italic) || (!ent_italic && !src_italic)) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
