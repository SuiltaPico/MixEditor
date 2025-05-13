import { MixEditor } from "../mix_editor";
import { BasicCompoMetaMap, register_basic_compos } from "./basic";
import { TreeCompoMetaMap, register_tree_compos } from "./tree";

export * from "./basic";
export * from "./tree";

export function register_compos(editor: MixEditor) {
  register_tree_compos(editor);
  register_basic_compos(editor);
}

export interface CoreCompoMetaMap extends BasicCompoMetaMap, TreeCompoMetaMap {}
