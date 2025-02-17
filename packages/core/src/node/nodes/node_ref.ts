import { MixEditor } from "../../MixEditor";
import { TransferDataObject } from "../../saver/TransferDataObject";

export interface NodeRefTDO extends TransferDataObject {
  type: "node_ref";
  node_ids: string[];
}

export function create_NodeRefTDO(id: string, node_ids: string[]): NodeRefTDO {
  return {
    id,
    type: "node_ref",
    node_ids,
  };
}