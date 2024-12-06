/** 操作。
 * `TData` 要求是可序列化的。
 */
export interface Operation<TData = any> {
  id: string;
  /** 操作的类型。*/
  type: string;

  data: TData;

  /** 操作所基于的版本。*/
  version: number;
  /** 合并到哪个 Operation。*/
  merge_with?: string;
}

export type OperationRunningBehavior = "execute" | "undo";

export interface OperationBehavior {
  execute(operation: Operation): void | Promise<void>;
  undo(operation: Operation): void | Promise<void>;
  cancel(
    operation: Operation,
    /** 正在执行的操作行为。如果为空，则表示没有正在执行的行为。*/
    running_behavior?: OperationRunningBehavior
  ): void | Promise<void>;
  merge?(operation: Operation): boolean | Promise<boolean>;
  /** 处理错误。处理 `execute` 或者 `undo` 产生的错误，恢复文档至正确的状态。 */
  handle_error(operation: Operation, error: Error): void | Promise<void>;
  /** 序列化操作。 */
  serialize?(operation: Operation): string | Promise<string>;
}

export class OperationManagerNoBehaviorError extends Error {
  constructor(public operation: Operation) {
    super(
      `No behavior for operation: ${operation.type}, It may be necessary to register behaviors for this type of operation.`
    );
  }
}

export class OperationManager {
  behaviors_map = new Map<string, OperationBehavior>();
  set_behavior(type: string, behavior: OperationBehavior) {
    this.behaviors_map.set(type, behavior);
  }

  remove_behavior(type: string) {
    this.behaviors_map.delete(type);
  }

  /** 执行操作。*/
  execute(operation: Operation) {
    const behavior = this.behaviors_map.get(operation.type);
    if (behavior) {
      return behavior.execute(operation);
    } else {
      throw new OperationManagerNoBehaviorError(operation);
    }
  }

  /** 撤销操作。*/
  undo(operation: Operation) {
    const behavior = this.behaviors_map.get(operation.type);
    if (behavior) {
      return behavior.undo(operation);
    } else {
      throw new OperationManagerNoBehaviorError(operation);
    }
  }

  cancel(operation: Operation, running_behavior?: OperationRunningBehavior) {
    const behavior = this.behaviors_map.get(operation.type);
    if (behavior) {
      return behavior.cancel(operation, running_behavior);
    } else {
      throw new OperationManagerNoBehaviorError(operation);
    }
  }

  merge(src: Operation, target: Operation) {
    const behavior = this.behaviors_map.get(src.type);
    if (behavior) {
      return behavior.merge?.(target);
    } else {
      throw new OperationManagerNoBehaviorError(src);
    }
  }

  handle_error(operation: Operation, error: Error) {
    const behavior = this.behaviors_map.get("error");
    if (behavior) {
      return behavior.handle_error(operation, error);
    } else {
      throw new OperationManagerNoBehaviorError(operation);
    }
  }
}
