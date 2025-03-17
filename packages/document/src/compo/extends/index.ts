import { MixEditor } from "@mixeditor/core";
import { register_EntChildCompo_doc_extend } from "./ent_child";
import { register_TextChildCompo_doc_extend } from "./text_child";

export * from "./text_child";
export * from "./ent_child";

export function register_extend_compos(editor: MixEditor) {
  register_TextChildCompo_doc_extend(editor);
  register_EntChildCompo_doc_extend(editor);
}
