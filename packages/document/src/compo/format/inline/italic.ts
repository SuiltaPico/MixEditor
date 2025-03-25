import {
  Compo,
  CreateCb,
  MixEditor,
  ToTdoDataCb,
  ToTdoDecision,
} from "@mixeditor/core";
import { DocMergeCb, handle_merge_allow_when_same_or_loose, MergeDecision } from "../../../pipe";

export class DocTextItalicCompo implements Compo {
  static type = "doc:text_italic" as const;
  get type() {
    return DocTextItalicCompo.type;
  }
}

export function register_DocTextItalicCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextItalicCompo.type, {
    [CreateCb]() {
      return new DocTextItalicCompo();
    },
    [DocMergeCb]: handle_merge_allow_when_same_or_loose,
  });
}
