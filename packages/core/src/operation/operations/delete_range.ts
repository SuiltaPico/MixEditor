import { MixEditor } from "../../MixEditor";
import { Operation } from "../Operation";

export interface DeleteRangeOperation extends Operation {
  data: {
    node_id: string;
    start: number;
    end: number;
    /** 被删除的子节点 */
    deleted_children: Node[];
  };
}

export function create_DeleteRangeOperation(
  id: string,
  node_id: string,
  start: number,
  end: number
) {
  return {
    id,
    type: "delete_range" as const,
    data: {
      node_id,
      start,
      end,
      deleted_children: [],
    },
  } satisfies DeleteRangeOperation;
}

export async function execute_DeleteRangeOperation(
  editor: MixEditor,
  operation: DeleteRangeOperation
) {
  const { node_id, start, end } = operation.data;
  const node = editor.node_manager.get_node_by_id(node_id);
  console.log("execute DeleteRangeOperation", node, start, end);

  if (!node) return;

  const result = await editor.node_manager.execute_handler(
    "delete_children",
    node,
    start,
    end
  );
  if (!result) return;

  operation.data.deleted_children = result as any[];
}

export async function undo_DeleteRangeOperation(
  editor: MixEditor,
  operation: DeleteRangeOperation
) {
  const { node_id, start } = operation.data;
  const node = editor.node_manager.get_node_by_id(node_id);
  if (!node) return;

  const result = await editor.node_manager.execute_handler(
    "insert_children",
    node,
    start,
    operation.data.deleted_children as any[]
  );
  if (!result) return;
}

export function init_DeleteRangeOperation(editor: MixEditor) {
  const { operation_manager } = editor;
  operation_manager.register_handlers("delete_range", {
    execute: execute_DeleteRangeOperation,
    undo: undo_DeleteRangeOperation,
  });
}
