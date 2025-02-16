import { MixEditor } from "../../MixEditor";
import { BatchOperation, init_BatchOperation } from "./Batch";
import { DeleteRangeOperation, init_DeleteRangeOperation } from "./DeleteRange";
import { InsertTextOperation } from "./InsertText";
export * from "./Batch";
export * from "./DeleteRange";

export interface Operations {
  insert_text: InsertTextOperation;
  delete_range: DeleteRangeOperation;
  batch: BatchOperation;
}

export function init_operations(editor: MixEditor) {
  init_DeleteRangeOperation(editor);
  init_BatchOperation(editor);
}
