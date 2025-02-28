import { Ent } from "./ent";
import { BehaviorHandler } from "../common/behavior";
export type EntBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = BehaviorHandler<Ent, TParams, TResult, TExCtx>;

/** 实体行为映射表。由行为id映射到行为处理器。 */
export type EntBehaviorMap<TExCtx extends any> = {
  [key: string]: EntBehaviorHandler<any, any, TExCtx>;
};
