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

export class OperationManager {
  /** 操作行为映射。*/
  private behaviors_map = new Map<string, OperationBehavior>();

  /** 设置操作行为 */
  set_behavior<TData>(type: string, behavior: OperationBehavior<TData>) {
    this.behaviors_map.set(type, behavior);
  }

  /** 移除操作行为 */
  remove_behavior(type: string) {
    this.behaviors_map.delete(type);
  }

  /** 获取操作行为 */
  private getBehavior<TData>(type: string): OperationBehavior<TData> {
    const behavior = this.behaviors_map.get(type);
    if (!behavior) {
      throw new OperationManagerNoBehaviorError({ type } as Operation);
    }
    return behavior as OperationBehavior<TData>;
  }

  /** 执行操作。*/
  execute<TData>(operation: Operation<TData>) {
    const behavior = this.getBehavior<TData>(operation.type);
    return behavior.execute(operation);
  }

  /** 撤销操作。*/
  undo<TData>(operation: Operation<TData>) {
    const behavior = this.getBehavior<TData>(operation.type);
    return behavior.undo(operation);
  }

  /** 取消操作。*/
  cancel<TData>(
    operation: Operation<TData>,
    running_behavior?: OperationRunningBehavior
  ) {
    const behavior = this.getBehavior<TData>(operation.type);
    return behavior.cancel(operation, running_behavior);
  }

  /** 合并操作。*/
  merge<TData>(src: Operation<TData>, target: Operation<TData>) {
    const behavior = this.getBehavior<TData>(src.type);
    if (behavior.merge) {
      return behavior.merge(target);
    }
    return false;
  }

  /** 处理错误。*/
  handle_error<TData>(operation: Operation<TData>, error: Error) {
    const behavior = this.getBehavior<TData>("error");
    return behavior.handle_error(operation, error);
  }
}