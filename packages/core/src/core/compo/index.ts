import { MixEditor } from "../mix_editor";
import { register_tree_compos } from "./tree";

export * from "./basic";
export * from "./tree";

export function register_compos(editor: MixEditor) {
  register_tree_compos(editor);
}
