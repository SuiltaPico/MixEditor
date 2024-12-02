/** 操作。
 * `TData` 要求是可序列化的。
 */
export interface Operation<TData = any> {
  id: string;
  /** 操作的类型。*/
  type: string;

  data: TData;

  /** 操作所基于的版本。*/
  version: bigint;
  /** 合并到哪个 Operation。*/
  merge_with?: string;
}

export interface OperationBehavior {
  execute(operation: Operation): void | Promise<void>;
  undo(operation: Operation): void | Promise<void>;
  cancel(operation: Operation): void | Promise<void>;
  merge?(operation: Operation): boolean | Promise<boolean>;
  handle_error(operation: Operation, error: Error): void | Promise<void>;
}

export class OperationManagerNoBehaviorError extends Error {
  constructor(public operation: Operation) {
    super(`No behavior for operation: ${operation.type}`);
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

  cancel(operation: Operation) {
    const behavior = this.behaviors_map.get(operation.type);
    if (behavior) {
      return behavior.cancel(operation);
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
