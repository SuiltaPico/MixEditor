import {
  Compo,
  MixEditor,
  ToTdoCb,
  FromTdoCb,
} from "@mixeditor/core";
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
    [FromTdoCb]({ input }) {
      return new DocTextBoldCompo();
    },
  });
}
