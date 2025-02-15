import { Operation } from "../Operation";

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
