import { Op } from "./op";
import { OpCtx } from "./op_ctx";

export interface IOpExecutorBuffer {
  push(op: Op): void;
  pop(): Op | undefined;
  clear(): void;
  size(): number;
}

export class ArrayOpExecutorBuffer implements IOpExecutorBuffer {
  private readonly buffer: Op[] = [];

  push(op: Op): void {
    this.buffer.push(op);
  }

  pop(): Op | undefined {
    return this.buffer.pop();
  }

  clear(): void {
    this.buffer.length = 0;
  }

  size(): number {
    return this.buffer.length;
  }
}

export interface IOpExecutor<TBuffer extends IOpExecutorBuffer> {
  get_buffer(): TBuffer;
  get_undo_stack(): Op[];
  wait_for_idle(): Promise<void>;

  execute(op: Op): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}

/** 操作执行类型。 */
export enum OpExecType {
  /** 撤销操作。 */
  Undo = "undo",
  /** 执行操作。 */
  Execute = "execute",
  /** 重做操作。 */
  Redo = "redo",
}

/** 操作执行错误。 */
export class OpExecError implements Error {
  name = "OpExecError";
  message: string;
  constructor(
    public readonly op: Op,
    public readonly exec_type: OpExecType,
    public readonly exec_err: any,
    public readonly recovery_err: any
  ) {
    if (recovery_err) {
      this.message = `操作在执行 ${this.exec_type} 过程中发生错误。且在错误恢复过程中发生了新的错误。`;
    } else {
      this.message = `操作在执行 ${this.exec_type} 过程中发生错误。已进行错误恢复。`;
    }
  }
}

/** 操作执行器。
 * 操作执行器用于执行操作。
 *
 * 操作执行器是异步串行的，即在同一时间只能有一个操作在执行。
 */
export class OpExecutor<TBuffer extends IOpExecutorBuffer>
  implements IOpExecutor<TBuffer>
{
  /** 撤销栈。最大占用空间会与操作历史缓冲区相同。 */
  private readonly undo_stack: Op[] = [];

  /** 当前正在执行的操作。 */
  private curr_op_exec:
    | {
        op: Op;
        type: OpExecType;
        promise: Promise<void>;
      }
    | undefined;

  get_undo_stack(): Op[] {
    return this.undo_stack;
  }

  get_buffer() {
    return this.history_buffer;
  }

  // async 函数：等待当前所有待定操作执行完毕。以保证实体状态已经应用了最新的操作。
  async wait_for_idle() {
    if (this.curr_op_exec) {
      return await this.curr_op_exec.promise;
    }
    return Promise.resolve();
  }

  /**
   * 处理操作执行过程中的错误
   * @param op 当前操作
   * @param exec_type 执行类型
   * @param err 执行错误
   * @returns 处理后的错误（如果有）
   */
  private async handle_op_error(
    op: Op,
    exec_type: OpExecType,
    err: any
  ): Promise<OpExecError | undefined> {
    let recovery_err: any;

    // 尝试错误恢复
    let recovered = false;
    try {
      recovered = await this.op_ctx.exec_behavior(op, "error_recovery", {
        err,
        exec_type,
      });
    } catch (e) {
      recovery_err = e;
    }

    // 检查恢复是否失败
    if (!recovered || recovery_err) {
      // 补一个错误恢复失败原因
      if (!recovery_err) {
        recovery_err = new Error("操作的 error_recovery 指示错误恢复失败。");
      }
      // 错误恢复失败，抛弃所有历史操作
      this.history_buffer.clear();
      this.undo_stack.length = 0; // 清空撤销栈

      return new OpExecError(op, exec_type, err, recovery_err);
    }
  }

  /** 执行操作。
   * - 错误处理：执行出错 Op 不会被推入 history_buffer。
   */
  async execute(op: Op): Promise<void> {
    // console.log("[OpExecutor] execute.wait_for_idle", op);
    await this.wait_for_idle();
    // console.log("[OpExecutor] execute.start", op);
    const op_exec_done_pwr = Promise.withResolvers<void>();
    this.curr_op_exec = {
      op,
      type: OpExecType.Execute,
      promise: op_exec_done_pwr.promise,
    };

    let error_result: OpExecError | undefined;

    try {
      // console.log("[OpExecutor] execute.execute", op);
      await this.op_ctx.exec_behavior(op, "execute", {});
      // console.log("[OpExecutor] execute.done", op);
      this.history_buffer.push(op);
      this.undo_stack.length = 0; // 清空撤销栈
    } catch (e) {
      // console.log("[OpExecutor] execute.error", op, e);
      error_result = await this.handle_op_error(op, OpExecType.Execute, e);
      // console.log("[OpExecutor] execute.error.done", op, error_result);
    } finally {
      this.curr_op_exec = undefined;
      op_exec_done_pwr.resolve();
    }

    if (error_result) throw error_result;
  }

  /** 撤销操作。
   * - 错误处理：撤销出错所有历史会被抛弃。
   */
  async undo(): Promise<void> {
    await this.wait_for_idle();

    const op = this.history_buffer.pop();
    if (!op) return;

    // 将要撤销的操作加入撤销栈
    this.undo_stack.push(op);

    const undo_done_pwr = Promise.withResolvers<void>();
    this.curr_op_exec = {
      op,
      type: OpExecType.Undo,
      promise: undo_done_pwr.promise,
    };

    let error_result: OpExecError | undefined;

    try {
      await this.op_ctx.exec_behavior(op, "undo", {});
    } catch (e) {
      error_result = await this.handle_op_error(op, OpExecType.Undo, e);
      // 如果撤销失败，从撤销栈中移除
      if (error_result) {
        this.undo_stack.pop();
      }
    } finally {
      this.curr_op_exec = undefined;
      undo_done_pwr.resolve();
    }

    if (error_result) throw error_result;
  }

  /** 重做操作。
   * - 错误处理：重做出错可能会导致状态异常，所有历史会被抛弃。
   */
  async redo(): Promise<void> {
    await this.wait_for_idle();

    const op = this.undo_stack.pop();
    console.log("[OpExecutor] redo.pop", op);
    if (!op) return;

    const redo_done_pwr = Promise.withResolvers<void>();
    this.curr_op_exec = {
      op,
      type: OpExecType.Redo,
      promise: redo_done_pwr.promise,
    };

    let error_result: OpExecError | undefined;

    try {
      await this.op_ctx.exec_behavior(op, "execute", {});
      this.history_buffer.push(op);
    } catch (e) {
      error_result = await this.handle_op_error(op, OpExecType.Redo, e);
      // 如果重做失败，将操作放回撤销栈
      if (error_result) {
        this.undo_stack.push(op);
      }
    } finally {
      this.curr_op_exec = undefined;
      redo_done_pwr.resolve();
    }

    if (error_result) throw error_result;
  }

  constructor(
    public readonly op_ctx: OpCtx<any, any, any>,
    public readonly history_buffer: TBuffer
  ) {}
}
