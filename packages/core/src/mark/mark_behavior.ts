import { Mark } from "./mark";
import { BehaviorHandler } from "../common/behavior";
export type MarkBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx extends any
> = BehaviorHandler<Mark, TParams, TResult, TExCtx>;

/** 标记行为映射表。由行为id映射到行为处理器。 */
export type MarkBehaviorMap<TExCtx extends any> = {
  [key: string]: MarkBehaviorHandler<any, any, TExCtx>;
};
