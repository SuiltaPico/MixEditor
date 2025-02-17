import { MixEditor } from "../../MixEditor";
import { BatchOperation, init_BatchOperation } from "./batch";
import { DeferredOperation, init_DeferredOperation } from "./deferred";
import { DeleteRangeOperation, init_DeleteRangeOperation } from "./delete_range";
import {
  init_InsertChildrenOperation,
  InsertChildrenOperation,
} from "./insert_children";
import { InsertTextOperation } from "./InsertText";
export * from "./batch";
export * from "./delete_range";
export * from "./deferred";
export * from "./insert_children";

export interface Operations {
  insert_text: InsertTextOperation;
  delete_range: DeleteRangeOperation;
  batch: BatchOperation;
  deferred: DeferredOperation;
  insert_children: InsertChildrenOperation;
}

export function init_operations(editor: MixEditor) {
  const fns = [
    init_DeleteRangeOperation,
    init_BatchOperation,
    init_DeferredOperation,
    init_InsertChildrenOperation,
  ];
  for (const fn of fns) {
    fn(editor);
  }
}
