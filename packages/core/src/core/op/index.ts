import { MixEditor } from "../mix_editor";
import { register_TreeRangeDeleteOp } from "./tree_range_delete";

export * from "./tree_range_delete";

export function register_core_ops(editor: MixEditor) {
  register_TreeRangeDeleteOp(editor);
}
