import { InsertTextOperation } from "./InsertText";
import { DeleteRangeOperation } from "./DeleteRange";

export interface Operations {
  insert_text: InsertTextOperation;
  delete_range: DeleteRangeOperation;
}
