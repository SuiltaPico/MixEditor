import {
  Compo,
  CreateCb,
  MixEditor
} from "@mixeditor/core";
import { DocMergeCb, handle_merge_allow_when_same } from "../../../pipe";

export class DocCodeInlineCompo implements Compo {
  static type = "doc:code_inline" as const;
  get type() {
    return DocCodeInlineCompo.type;
  }
}

export function register_DocCodeInlineCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocCodeInlineCompo.type, {
    [CreateCb]() {
      return new DocCodeInlineCompo();
    },
    [DocMergeCb]: handle_merge_allow_when_same,
  });
}
