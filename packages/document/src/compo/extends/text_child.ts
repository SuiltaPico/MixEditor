import {
  MixEditor,
  TextChildCompo,
  TreeDeleteChildrenOp,
} from "@mixeditor/core";
import {
  DocRangeDeleteCb,
  RangeDeleteDecision
} from "../../pipe";

export function register_TextChildCompo_doc_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextChildCompo.type, {
  });
}
