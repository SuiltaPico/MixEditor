import { BehaviorHandler } from "../common/behavior";
import { Op } from "./op";

export type OpBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = BehaviorHandler<Op, TParams, TResult, TExCtx>;

/** 操作行为映射表 */
export type OpBehaviorMap<TExCtx extends any> = {
  [key: string]: OpBehaviorHandler<any, any, TExCtx>;
};
