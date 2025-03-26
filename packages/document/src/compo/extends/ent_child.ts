import {
  EntChildCompo,
  MixEditor
} from "@mixeditor/core";

export function register_EntChildCompo_doc_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(EntChildCompo.type, {

  });
}
