import { MixEditor } from "../mix_editor";
import { register_TreeChildrenDeleteOp } from "./tree_children_delete";
import { register_TreeChildrenInsertOp } from "./tree_children_insert";
import { register_TreeChildrenMoveOp } from "./tree_children_move";

export * from "./tree_children_delete";
export * from "./tree_children_insert";
export * from "./tree_children_move";

export function register_ops(editor: MixEditor) {
  register_TreeChildrenDeleteOp(editor);
  register_TreeChildrenMoveOp(editor);
  register_TreeChildrenInsertOp(editor);
}
