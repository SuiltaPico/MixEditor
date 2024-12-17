import { RingBuffer } from "../common/ringbuffer";
import {
  Operation,
  OperationManager,
  OperationRunningBehavior,
} from "./Operation";
import { CanceledError } from "../common/error";
import { AsyncTask } from "../common/promise";

export type OperationType = "undo" | "execute";

export interface OperationExecution {
  operation: Operation;
  type: OperationType;
}

/** 操作的状态 */
export enum OperationState {
  /** 未完成 */
  Pending,
  /** 执行中 */
  Executing,
  /** 已完成 */
  Completed,
}

/** 操作历史管理器。
 * 操作历史管理器用于管理操作的历史，包括撤销和重做。操作历史管理器完全信任于操作的行为实现。
 *
 * 操作历史管理器是异步串行的，即在同一时间只能有一个操作在执行。
 *
 * ## 操作历史序列
 * 操作历史是一个序列，序列中的操作分为三种类型：
 * 1. 未完成的操作：未完成的操作是指已经进入执行队列但是尚未开始执行的操作。
 * 2. 正在执行的操作：正在执行的操作是指已经开始执行但是尚未结束的操作。
 * 3. 已完成的操作：已完成的操作是指已经执行完毕的操作。
 *
 * 在操作历史序列中，不可能存在两个同一个操作的执行。
 *
 * ## 操作合并
 * 设 Operation `A`、`B`，如果 `A` 先执行，且 `B.merge_with == A.id`，
 * 那么 `B` 在执行后，`B` 会被合并到 A 中，且 `B` 不会进入执行队列。
 *
 * ## 撤销和重做
 * 撤销会把当前操作从操作历史中移除，并把该操作压入撤销栈中。
 *
 * 撤销操作会根据操作的类型执行不同的额外行为：
 * * 如果撤销了未完成的操作，那么管理器只是将该操作从执行队列中移除。
 * * 如果撤销了正在执行的操作，那么管理器将执行操作的“取消行为”。
 * * 如果撤销了已完成的操作，那么管理器将执行操作的“撤销行为”。
 *
 * 如果在存在撤销栈的时候执行了新的操作，那么撤销栈就会被清空，然后再执行新的操作。
 *
 *
 * ## 错误处理
 * 如果操作执行失败，管理器会调用操作的“错误处理行为”。错误处理行为不能打断后续的调度流程。
 */
export class HistoryManager {
  /** 操作历史缓冲区。 */
  private readonly history_buffer = new RingBuffer<Operation>(100);
  /** 撤销栈。最大占用空间与操作历史缓冲区相同。 */
  private readonly undo_stack: Operation[] = [];

  /** 当前正在执行的操作。 */
  private current_execution: OperationExecution | null = null;
  /** 待执行的操作。 */
  private pending_operations: OperationExecution[] = [];
  /** 是否正在调度操作执行。 */
  private is_scheduling = false;

  /** 当前正在执行的操作的取消函数。 */
  private cancel_current_operation: AsyncTask<
    void,
    [OperationRunningBehavior | undefined]
  > | null = null;

  /** 为 execute 提供在操作执行完毕、报错或者被取消后再返回的需求。 */
  private operation_done_promise_map = new WeakMap<
    Operation,
    PromiseWithResolvers<void>
  >();

  /** 获取操作的当前状态 */
  get_operation_state(operation: Operation): OperationState {
    if (this.current_execution?.operation === operation) {
      return OperationState.Executing;
    }
    if (this.pending_operations.some((op) => op.operation === operation)) {
      return OperationState.Pending;
    }
    return OperationState.Completed;
  }

  /** 执行新操作。在操作执行完毕后返回。 */
  async execute(operation: Operation) {
    // 如果有未重做的操作，清空撤销栈
    if (this.undo_stack.length > 0) {
      this.undo_stack.length = 0;
    }

    this.history_buffer.push(operation);
    this.pending_operations.push({
      operation,
      type: "execute",
    });

    // 创建 PromiseWithResolvers 并存储在 map 中
    const promiseWithResolvers = Promise.withResolvers<void>();
    this.operation_done_promise_map.set(operation, promiseWithResolvers);

    this.scheduleOperations();

    // 返回 promise
    return promiseWithResolvers.promise;
  }

  /** 撤销操作 */
  async undo() {
    const operation = this.history_buffer.pop();
    if (!operation) return;

    const state = this.get_operation_state(operation);

    this.undo_stack.push(operation);

    switch (state) {
      case OperationState.Executing:
        // 取消正在执行的操作
        await this.cancel_current_operation?.execute("execute");
        break;
      case OperationState.Pending:
        await this.operation_manager.cancel(operation, undefined);
        // 从待执行队列中移除
        this.pending_operations = this.pending_operations.filter(
          (op) => op.operation !== operation
        );
        break;
      case OperationState.Completed:
        // 将操作添加到撤销队列
        this.pending_operations.push({
          operation,
          type: "undo",
        });
        break;
    }

    this.scheduleOperations();
  }

  /** 重做操作 */
  async redo() {
    const operation = this.undo_stack.pop();
    if (!operation) return;

    this.history_buffer.push(operation);

    const state = this.get_operation_state(operation);

    switch (state) {
      case OperationState.Executing:
        // 取消正在执行的操作
        await this.cancel_current_operation?.execute("undo");
        break;
      case OperationState.Pending:
        await this.operation_manager.cancel(operation, undefined);
        // 从待执行队列中移除
        this.pending_operations = this.pending_operations.filter(
          (op) => op.operation !== operation
        );
        break;
      case OperationState.Completed:
        // 将操作添加到待执行队列
        this.pending_operations.push({
          operation,
          type: "execute",
        });
        break;
    }

    this.scheduleOperations();
  }

  

  /** 调度操作执行 */
  private async scheduleOperations() {
    if (this.is_scheduling) return;

    this.is_scheduling = true;

    while (this.pending_operations.length > 0) {
      const execution = this.pending_operations.shift()!;
      this.current_execution = execution;

      // 设置取消函数
      this.cancel_current_operation = new AsyncTask(
        async (running_behavior) => {
          await this.operation_manager.cancel(
            execution.operation,
            running_behavior
          );
          this.current_execution = null;
          this.cancel_current_operation = null;

          // 调用 reject
          const promiseWithResolvers = this.operation_done_promise_map.get(
            execution.operation
          );
          promiseWithResolvers?.reject(
            new CanceledError("Operation was canceled")
          );
        }
      );

      // 执行操作
      try {
        if (execution.type === "undo") {
          await this.operation_manager.undo(execution.operation);
        } else {
          await this.operation_manager.execute(execution.operation);
          // 检查是否需要合并操作
          if (execution.operation.merge_with) {
            const target_op = this.history_buffer.find_last(
              (op) => op.id === execution.operation.merge_with
            );
            if (target_op) {
              // 从历史缓冲区中移除当前操作
              this.history_buffer.remove(execution.operation);
              // 合并操作
              await this.operation_manager.merge(
                target_op,
                execution.operation
              );
            }
          }
        }

        // 调用 resolve
        const promiseWithResolvers = this.operation_done_promise_map.get(
          execution.operation
        );
        promiseWithResolvers?.resolve();
      } catch (error) {
        try {
          // 让操作管理器处理错误，操作管理器应该正确恢复编辑器的状态
          await this.operation_manager.handle_error(
            execution.operation,
            error as Error
          );
        } catch (new_error) {
          // console.error(
          //   "在操作管理器处理如下错误时，发生了新的错误",
          //   error,
          //   new_error,
          //   "编辑器状态可能出现异常"
          // );
        }
        // 调用 reject
        const promiseWithResolvers = this.operation_done_promise_map.get(
          execution.operation
        );
        promiseWithResolvers?.reject(error);
      }

      this.current_execution = null;
      this.cancel_current_operation = null;
    }

    this.is_scheduling = false;
  }

  /** 清空操作历史
   * 该方法会清空历史记录缓冲区和撤销栈。
   * 如果有正在执行的操作，会等待其完成。
   * 如果有待执行的操作，会取消它们。
   */
  async clear_history() {
    // 取消所有待执行的操作
    for (const execution of this.pending_operations) {
      await this.operation_manager.cancel(execution.operation, undefined);
      
      // 调用 reject
      const pwr = this.operation_done_promise_map.get(
        execution.operation
      );
      pwr?.reject(new CanceledError("History was cleared"));
    }
    
    // 清空待执行队列
    this.pending_operations = [];
    
    // 如果有正在执行的操作，等待其完成
    if (this.current_execution) {
      await this.cancel_current_operation?.execute(undefined);
    }

    // 清空历史记录缓冲区和撤销栈
    this.history_buffer.clear();
    this.undo_stack.length = 0;
  }

  constructor(
    public readonly operation_manager: OperationManager,
    initial_capacity: number = 100
  ) {
    this.history_buffer = new RingBuffer<Operation>(initial_capacity);
  }
}
