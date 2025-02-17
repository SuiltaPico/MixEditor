import { MaybePromise } from "@mixeditor/common";
import { MixEditor } from "../../MixEditor";
import { Operation } from "../Operation";

/** 懒操作。只有在执行时才会产生具体的确定操作。
 *
 * 适用于需要等待前面操作队列完成，才能产生具体操作内容的情况。
 *
 * 该操作会在执行后销毁，并不能被撤销。
 */
export interface DeferredOperation extends Operation {
  type: "deferred";
  data: {
    /** 延迟执行的函数 */
    fn: () => MaybePromise<Operation[]>;
  };
}

export function create_DeferredOperation(
  id: string,
  fn: () => MaybePromise<Operation[]>
) {
  return {
    id,
    type: "deferred" as const,
    data: {
      fn,
    },
  } satisfies DeferredOperation;
}

export async function execute_DeferredOperation(
  editor: MixEditor,
  operation: DeferredOperation
) {
  const { fn } = operation.data;
  const children = await fn();
  return {
    dont_record: true,
    children,
  };
}

export function init_DeferredOperation(editor: MixEditor) {
  const { operation_manager } = editor;
  operation_manager.register_handlers("deferred", {
    execute: execute_DeferredOperation,
  });
}
