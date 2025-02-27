import { Op } from "./op";

export type BaseOpBehaviorParams<TExCtx extends any> = {
  ex_ctx: TExCtx;
  target: Op;
};

export type BuildOpBehaviorParams<
  T extends object,
  TExCtx extends any
> = BaseOpBehaviorParams<TExCtx> & T;

export type OpBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = (params: BuildOpBehaviorParams<TParams, TExCtx>) => TResult;

/** 操作行为映射表 */
export type OpBehaviorMap<TExCtx extends any> = {
  [key: string]: OpBehaviorHandler<any, any, TExCtx>;
};
