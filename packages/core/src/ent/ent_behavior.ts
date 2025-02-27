import { Ent } from "./ent";

export type BaseEntBehaviorParams<TExCtx extends any> = {
  ex_ctx: TExCtx;
  target: Ent;
};
export type BuildEntBehaviorParams<
  T extends object,
  TExCtx extends any
> = BaseEntBehaviorParams<TExCtx> & T;
export type EntBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = (params: BuildEntBehaviorParams<TParams, TExCtx>) => TResult;

/** 实体行为映射表。由行为id映射到行为处理器。 */
export type EntBehaviorMap<TExCtx extends any> = {
  [key: string]: EntBehaviorHandler<any, any, TExCtx>;
};
