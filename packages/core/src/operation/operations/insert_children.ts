import { MixEditor } from "../../MixEditor";
import { TransferDataObject } from "../../saver/TransferDataObject";
import { Operation } from "../Operation";

export interface InsertChildrenOperation extends Operation {
  type: "insert_children";
  data: {
    node_id: string;
    to: number;
    children: TransferDataObject[];
  };
}

export function create_InsertChildrenOperation(
  id: string,
  node_id: string,
  to: number,
  children: TransferDataObject[]
) {
  return {
    id,
    type: "insert_children" as const,
    data: {
      node_id,
      to,
      children,
    },
  } satisfies InsertChildrenOperation;
}

export async function execute_InsertChildrenOperation(
  editor: MixEditor,
  operation: InsertChildrenOperation
) {
  const { node_id, to, children } = operation.data;
  const node = editor.node_manager.get_node_by_id(node_id);
  if (!node) return;

  const result = await editor.node_manager.execute_handler(
    "insert_children",
    node,
    to,
    children as any[]
  );
  if (!result) return;
}

export async function undo_InsertChildrenOperation(
  editor: MixEditor,
  operation: InsertChildrenOperation
) {
  const { node_id, to } = operation.data;
  const node = editor.node_manager.get_node_by_id(node_id);
  if (!node) return;

  throw new Error("Not implemented");
}

export function init_InsertChildrenOperation(editor: MixEditor) {
  const { operation_manager } = editor;
  operation_manager.register_handlers("insert_children", {
    execute: execute_InsertChildrenOperation,
    undo: undo_InsertChildrenOperation,
  });
}
