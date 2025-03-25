import { OpMap, TransactionOp } from "../../op";
import { MixEditor } from "../mix_editor";
import { register_TreeDeepSplitOp, TreeDeepSplitOp } from "./tree/deep_split";
import {
  register_TreeDeleteChildrenOp,
  TreeDeleteChildrenOp,
} from "./tree/delete_children";
import {
  register_TreeInsertChildrenOp,
  TreeInsertChildrenOp,
} from "./tree/insert_children";
import {
  register_TreeMoveChildrenOp,
  TreeMoveChildrenOp,
} from "./tree/move_children";
import { register_TreeSplitOp, TreeSplitOp } from "./tree/split";

export * from "./tree/delete_children";
export * from "./tree/insert_children";
export * from "./tree/move_children";
export * from "./tree/split";
export * from "./tree/deep_split";

export function register_ops(editor: MixEditor) {
  register_TreeDeleteChildrenOp(editor);
  register_TreeMoveChildrenOp(editor);
  register_TreeInsertChildrenOp(editor);
  register_TreeSplitOp(editor);
  register_TreeDeepSplitOp(editor);
}

/** MixEditor 的操作表，供插件扩展 */
export interface MECoreOpMap extends OpMap {
  [TreeDeleteChildrenOp.type]: TreeDeleteChildrenOp;
  [TreeInsertChildrenOp.type]: TreeInsertChildrenOp;
  [TreeMoveChildrenOp.type]: TreeMoveChildrenOp;
  [TreeSplitOp.type]: TreeSplitOp;
  [TreeDeepSplitOp.type]: TreeDeepSplitOp;
  [TransactionOp.type]: TransactionOp;
}
