/** 编辑器操作的基础接口 */
export interface Op {
  /** 操作唯一标识 */
  id: string;
  /** 操作类型 */
  type: string;
  /** 操作参数 */
  params: unknown;
}

/** 事务操作上下文 */
export interface TransactionCtx {
  /** 包含的操作集合 */
  ops: Op[];
}
