import { MixEditor } from "../../mix_editor";
import { register_ChildCompo } from "./child";
import { register_EntChildCompo } from "./ent_child";
import { register_ParentEntCompo } from "./parent";
import { register_TextChildCompo } from "./text_child";

export * from "./ent_child";
export * from "./child";
export * from "./parent";
export * from "./text_child";
export * from "./cb";

export function register_tree_compos(editor: MixEditor) {
  register_EntChildCompo(editor);
  register_TextChildCompo(editor);
  register_ParentEntCompo(editor);
  register_ChildCompo(editor);
}
