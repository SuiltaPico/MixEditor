import { TransferDataObject } from "../../tdo/tdo";

export interface NodeRefNTDO extends TransferDataObject {
  type: "node_ref";
  node_id: string;
}

export function create_NodeRefNTDO(id: string, node_id: string): NodeRefNTDO {
  return {
    id,
    type: "node_ref",
    node_id,
  };
}
