import { MixEditor } from "../mix_editor";
import { BasicCompoMap, register_basic_compos } from "./basic";
import { register_tree_compos, TreeCompoMap } from "./tree";

export * from "./basic";
export * from "./tree";

export function register_compos(editor: MixEditor) {
  register_tree_compos(editor);
  register_basic_compos(editor);
}

export interface CoreCompoMap extends BasicCompoMap, TreeCompoMap {}
