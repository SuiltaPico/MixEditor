import { TransferDataObject } from "../../tdo/tdo";

export interface NodeRefTDO extends TransferDataObject {
  type: "node_ref";
  node_id: string;
}

export function create_NodeRefTDO(id: string, node_id: string): NodeRefTDO {
  return {
    id,
    type: "node_ref",
    node_id,
  };
}
