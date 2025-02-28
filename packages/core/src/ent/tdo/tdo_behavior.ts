import { BehaviorHandler } from "../../common/behavior";
import { EntTDO } from "./tdo";

export type EntTDOBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = BehaviorHandler<EntTDO, TParams, TResult, TExCtx>;

/** 实体TDO行为映射表。由行为id映射到行为处理器。 */
export type EntTDOBehaviorMap<TExCtx extends any> = {
  [key: string]: EntTDOBehaviorHandler<any, any, TExCtx>;
};
