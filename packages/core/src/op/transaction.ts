import { create_BaseOp, Op } from "./op";
import { OpBehaviorMap } from "./op_behavior";
import { OpCtx } from "./op_ctx";
import {
  ArrayOpExecutorBuffer,
  IOpExecutor,
  OpExecError,
  OpExecType,
  OpExecutor,
} from "./op_executor";

/** 事务接口。 */
export interface ITransaction extends IOpExecutor<ArrayOpExecutorBuffer> {
  /** 提交事务。
   * - 错误处理：如果事务提交时出错，则抛出错误。
   */
  commit(): Promise<void>;

  /** 回滚事务。将状态回滚到事务开始之前。
   * - 错误处理：如果在这个过程中发生了任何的错误，不可将状态回滚到事务开始之前，则抛出错误。
   */
  rollback(): Promise<void>;
  /** 等待事务提交。
   * - 错误处理：如果事务提交时出错，则抛出错误。
   * @returns 如果事务提交成功，则返回 true，否则返回 false。
   */
  wait_for_commited(): Promise<boolean>;
}

/** 事务。
 *
 * 可用于将多个操作组合在一起，作为一个整体执行。
 *
 * 事务的执行过程：
 * 1. 执行事务中的所有操作。
 * 2. 如果执行过程中没有发生错误，则提交事务。
 * 3. 如果执行过程中发生错误，则回滚事务。
 *
 */
export class Transaction
  extends OpExecutor<ArrayOpExecutorBuffer>
  implements ITransaction
{
  private readonly pwr: PromiseWithResolvers<boolean>;
  private pwr_resolved = false;

  constructor(op_ctx: OpCtx<any, any, any>, public executer: OpExecutor<any>) {
    super(op_ctx, new ArrayOpExecutorBuffer());
    this.pwr = Promise.withResolvers();
    executer.execute(create_TransOp(op_ctx.gen_id(), this));
  }

  async commit(): Promise<void> {
    this.pwr.resolve(true);
    this.pwr_resolved = true;
  }

  async rollback(): Promise<void> {
    // 如果用户要取消 Transaction
    if (!this.pwr_resolved) {
      this.pwr.resolve(false);
      this.pwr_resolved = true;
      // 走 TransOp 的 undo 流程，顺带删除 executer 的 TransOp
      await this.executer.undo();
    } else {
      // 否则，唯一的调用者只有 TransOp
      const buffer = this.get_buffer();

      while (buffer.size() > 0) {
        try {
          await this.undo();
        } catch (e) {
          // 无法恢复状态，抛出错误。
          throw e;
        }
      }
    }
  }
  
  async wait_for_commited() {
    return await this.pwr.promise;
  }
}

/** 事务操作。通常由事务管理器产生，在事物提交时执行结束。 */
export interface TransOp extends Op {
  type: "transaction";
  tr: ITransaction;
}

export function create_TransOp(id: string, tr: ITransaction): TransOp {
  const op = create_BaseOp(id, "transaction") as TransOp;
  op.tr = tr;
  return op;
}

export function register_TransOp_behavior(
  op_ctx: OpCtx<
    {
      transaction: TransOp;
    },
    OpBehaviorMap<any>,
    any
  >
) {
  op_ctx.register_handlers("transaction", {
    execute: async (params) => {
      // 如果出错，走 error_recovery 流程
      await params.item.tr.wait_for_commited();
    },
    undo: async (params) => {
      // 事务回滚出错如果不可恢复，则抛出错误
      await params.item.tr.rollback();
    },
    error_recovery: async (params) => {
      const err = params.err;
      // 如果错误未知、不可恢复、或者 undo 时出错，则不可处理
      if (
        !(err instanceof OpExecError) ||
        err.recovery_err ||
        err.exec_type === OpExecType.Undo
      )
        return;
      // 否则，处于执行（execute）或重做（redo）情况，则尝试回滚事务。
      await params.item.tr.rollback();
      return true;
    },
  });
}
