import {
  Compo,
  MixEditor,
  ToDtoDataCb,
  CreateCb,
  ToDtoDecision,
} from "@mixeditor/core";
import { DocMergeCb, handle_merge_always_allow, MergeDecision } from "../../../pipe";

export class DocCodeBlockCompo implements Compo {
  static type = "doc:code_block" as const;
  get type() {
    return DocCodeBlockCompo.type;
  }
}

export function register_DocCodeBlockCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocCodeBlockCompo.type, {
    [CreateCb]() {
      return new DocCodeBlockCompo();
    },
    [DocMergeCb]: handle_merge_always_allow,
  });
}
