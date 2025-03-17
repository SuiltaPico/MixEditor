import {
  Compo,
  MixEditor,
  ToTdoCb,
  FromTdoCb,
} from "@mixeditor/core";

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
    [FromTdoCb]({ input }) {
      return new DocTextItalicCompo();
    },
  });
}
