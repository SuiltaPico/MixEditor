import { MixEditor } from "../../mixeditor";
import { Operation } from "../operation";

/** 批量操作。
 * 批量操作是多个操作的集合，可以一起执行和撤销。
 * 批量操作的执行是非原子的，允许部分成功。撤销只会撤销已成功执行的操作。
 */
export interface BatchOperation extends Operation {
  type: "batch";
  data: {
    /** 要进行批量操作的列表。 */
    operations: Operation[];
    /** 每个操作在上一次的执行中是否成功。 */
    done: boolean[];
  };
}

export function create_BatchOperation(
  id: string,
  operations: Operation[]
): BatchOperation {
  return {
    id,
    type: "batch",
    data: { operations, done: operations.map(() => false) },
  };
}

export async function execute_BatchOperation(
  editor: MixEditor,
  operation: BatchOperation
) {
  const { operations, done } = operation.data;
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    try {
      const result = await editor.operation_manager.execute_handler(
        "execute",
        operation
      );
      if (result) {
        if (result.dont_record) {
          operations.splice(i, 1);
          done.splice(i, 1);
          i--;
        }
        if (result.children) {
          operations.splice(i + 1, 0, ...result.children);
          done.splice(i + 1, 0, ...result.children.map(() => false));
        }
      }
      done[i] = true;
    } catch (error) {
      done[i] = false;
      throw error;
    }
  }
}

export async function undo_BatchOperation(
  editor: MixEditor,
  operation: BatchOperation
) {
  const { operations, done } = operation.data;
  for (let i = operations.length - 1; i >= 0; i--) {
    const operation = operations[i];
    if (!done[i]) continue;
    await editor.operation_manager.execute_handler("undo", operation);
  }
}

export function init_BatchOperation(editor: MixEditor) {
  const { operation_manager } = editor;
  operation_manager.register_handlers("batch", {
    execute: execute_BatchOperation,
    undo: undo_BatchOperation,
  });
}
