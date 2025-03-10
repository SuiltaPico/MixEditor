import { BehaviorHandler } from "../../common/behavior";
import { MarkTDO } from "./tdo";

export type MarkTDOBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = BehaviorHandler<MarkTDO, TParams, TResult, TExCtx>;

/** 标记TDO行为映射表。由行为id映射到行为处理器。 */
export type MarkTDOBehaviorMap<TExCtx extends any> = {
  [key: string]: MarkTDOBehaviorHandler<any, any, TExCtx>;
};
