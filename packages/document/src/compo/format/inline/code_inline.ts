import {
  Compo,
  CreateCb,
  MixEditor,
  ToTdoDataCb,
  ToTdoDecision,
} from "@mixeditor/core";
import { DocMergeCb, handle_same_merge, MergeDecision } from "../../../pipe";

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
    [DocMergeCb]: handle_same_merge,
  });
}
