import { create_BaseOp, Op } from "./op";
import { OpCtx } from "./op_ctx";
import {
  ArrayOpExecutorBuffer,
  IOpExecutor,
  OpExecError,
  OpExecType,
  OpExecutor,
} from "./op_executor";

export interface ITransaction extends IOpExecutor<ArrayOpExecutorBuffer> {
  /** 回滚事务。 */
  rollback(): Promise<void>;
  /** 等待事务提交。 */
  wait_for_commited(): Promise<void>;
}

export class Transaction
  extends OpExecutor<ArrayOpExecutorBuffer>
  implements ITransaction
{
  private readonly promise: Promise<void>;
  constructor(
    op_ctx: OpCtx<any, any, any>,
    callback: (tr: ITransaction) => Promise<void>
  ) {
    super(op_ctx, new ArrayOpExecutorBuffer());
    this.promise = callback(this);
  }

  async rollback(): Promise<void> {
    const buffer = this.get_buffer();

    while (buffer.size() > 0) {
      try {
        await this.undo();
      } catch (e) {
        if (!(e instanceof OpExecError) || !e.recovery_err) throw e;
        // 如果错误已经被恢复，则不抛出错误
      }
    }
  }

  async wait_for_commited(): Promise<void> {
    return await this.promise;
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
    any,
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
      if (!(err instanceof OpExecError)) return;
      if (!err.recovery_err && err.exec_type === OpExecType.Execute) {
        try {
          await params.item.tr.rollback();
        } catch (e) {
          console.error(e);
        }
      }
    },
  });
}
