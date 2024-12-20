import { TwoLevelTypeMap } from "../common/TwoLevelTypeMap";
import { ParametersExceptFirst } from "../common/type";

/** 操作。 */
export interface Operation<TData = any> {
  /** 操作的唯一标识。*/
  id: string;
  /** 操作的类型。*/
  type: string;

  /** 操作的数据。*/
  data: TData;

  /** 操作所基于的版本。*/
  version: number;
  /** 合并到哪个 Operation。*/
  merge_with?: string;
}

/** 操作的正在执行的行为。*/
export type OperationRunningBehavior = "execute" | "undo";

/** 操作行为接口，使用泛型确保数据类型一致性 */
export interface OperationBehavior<TData = any> {
  /** 执行操作。*/
  execute(operation: Operation<TData>): void | Promise<void>;
  /** 撤销操作。*/
  undo(operation: Operation<TData>): void | Promise<void>;
  /** 取消操作。*/
  cancel(
    operation: Operation<TData>,
    /** 正在执行的操作行为。如果为空，则表示没有正在执行的行为。*/
    running_behavior?: OperationRunningBehavior
  ): void | Promise<void>;
  merge?(operation: Operation<TData>): boolean | Promise<boolean>;
  /** 处理错误。处理 `execute` 或者 `undo` 产生的错误，恢复文档至正确的状态。 */
  handle_error(operation: Operation<TData>, error: Error): void | Promise<void>;
  /** 序列化操作。 */
  serialize?(operation: Operation<TData>): string | Promise<string>;
}

/** 操作行为未找到错误 */
export class OperationManagerNoBehaviorError extends Error {
  constructor(public operation: Operation) {
    super(
      `No behavior for operation: ${operation.type}, 可能需要为此类型的操作注册行为。`
    );
  }
}

function gen_run_operation_behavior<
  TBehavior extends keyof TOperationBehavior,
  TOperationBehavior extends OperationBehavior = OperationBehavior
>(operation_manager: OperationManager<TOperationBehavior>, behavior_name: TBehavior) {
  return function <TData>(
    operation: Operation<TData>,
    ...args: ParametersExceptFirst<TOperationBehavior[TBehavior]>
  ) {
    const behavior = operation_manager.get_behavior<TBehavior>(
      operation.type,
      behavior_name
    );
    return (behavior as any)(
      operation,
      ...args
    ) as TOperationBehavior[TBehavior] extends (...args: any) => any
      ? ReturnType<TOperationBehavior[TBehavior]>
      : never;
  };
}

/** 操作管理器。
 *
 * 管理操作的行为。允许通过更改第一个泛型参数，来扩展操作行为的具体类型。
 */
export class OperationManager<
  TOperationBehavior extends OperationBehavior = OperationBehavior
> {
  /** 操作行为映射。*/
  private behaviors_map = new TwoLevelTypeMap<TOperationBehavior>();

  /** 设置操作行为 */
  set_behavior<TBehavior extends keyof TOperationBehavior>(
    type: string,
    behavior_name: TBehavior,
    behavior: TOperationBehavior[TBehavior]
  ) {
    this.behaviors_map.set(behavior_name, type, behavior);
  }

  /** 移除操作行为 */
  remove_behavior<TBehavior extends keyof TOperationBehavior>(
    type: string,
    behavior_name: TBehavior
  ) {
    this.behaviors_map.remove(behavior_name, type);
  }

  /** 获取操作行为 */
  get_behavior<TBehavior extends keyof TOperationBehavior>(
    type: string,
    behavior_name: TBehavior
  ): TOperationBehavior[TBehavior] {
    const behavior = this.behaviors_map.get(behavior_name, type);
    if (!behavior) {
      throw new OperationManagerNoBehaviorError({ type } as Operation);
    }
    return behavior as TOperationBehavior[TBehavior];
  }

  /** 执行操作。*/
  execute = gen_run_operation_behavior<"execute", TOperationBehavior>(
    this,
    "execute"
  );

  /** 撤销操作。*/
  undo = gen_run_operation_behavior<"undo", TOperationBehavior>(
    this,
    "undo"
  );

  /** 取消操作。*/
  cancel = gen_run_operation_behavior<"cancel", TOperationBehavior>(
    this,
    "cancel"
  );

  /** 合并操作。*/
  merge<TData>(src: Operation<TData>, target: Operation<TData>) {
    const behavior = this.get_behavior(src.type, "merge");
    if (behavior) {
      return behavior(target);
    }
    return false;
  }

  /** 处理错误。*/
  handle_error = gen_run_operation_behavior<"handle_error", TOperationBehavior>(
    this,
    "handle_error"
  );
}
