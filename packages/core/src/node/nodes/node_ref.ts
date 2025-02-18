import { MixEditor } from "../../mixeditor";
import { TransferDataObject } from "../tdo";

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