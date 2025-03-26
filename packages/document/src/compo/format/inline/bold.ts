import {
  Compo,
  CreateCb,
  MixEditor
} from "@mixeditor/core";
import { DocMergeCb, handle_merge_allow_when_same } from "../../../pipe";

export class DocTextBoldCompo implements Compo {
  static type = "doc:text_bold" as const;
  get type() {
    return DocTextBoldCompo.type;
  }
}

export function register_DocTextBoldCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextBoldCompo.type, {
    [CreateCb]() {
      return new DocTextBoldCompo();
    },
    [DocMergeCb]: handle_merge_allow_when_same,
  });
}
