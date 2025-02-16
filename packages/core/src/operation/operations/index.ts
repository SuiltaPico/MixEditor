import { InsertTextOperation } from "./InsertText";
import { DeleteRangeOperation, init_DeleteRangeOperation } from "./DeleteRange";
import { MixEditor } from "../../MixEditor";
import { BatchOperation } from "./Batch";
export * from "./DeleteRange";
export * from "./Batch";

export interface Operations {
  insert_text: InsertTextOperation;
  delete_range: DeleteRangeOperation;
  batch: BatchOperation;
}

export function init_operations(editor: MixEditor) {
  init_DeleteRangeOperation(editor);
}
