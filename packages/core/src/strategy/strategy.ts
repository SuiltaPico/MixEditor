import { MaybePromise } from "@mixeditor/common";

/** 静态策略。返回固定的决策。 */
export interface StaticStrategy<TDecision> {
  type: "static";
  value: TDecision;
}

/** 创建静态策略。 */
export function create_StaticStrategy<TDecision>(
  value: TDecision
): StaticStrategy<TDecision> {
  return {
    type: "static",
    value,
  };
}

/** 动态策略。根据上下文和全局上下文返回决策。 */
export interface DynamicStrategy<TItem, TContext, TDecision, TGlobalContext> {
  type: "dynamic";
  decision: (
    global_context: TGlobalContext,
    item: TItem,
    context: TContext
  ) => MaybePromise<TDecision>;
}

/** 创建动态策略。 */
export function create_DynamicStrategy<
  TItem,
  TContext,
  TDecision,
  TGlobalContext
>(
  decision: DynamicStrategy<
    TItem,
    TContext,
    TDecision,
    TGlobalContext
  >["decision"]
): DynamicStrategy<TItem, TContext, TDecision, TGlobalContext> {
  return {
    type: "dynamic",
    decision,
  };
}

/** 策略。根据上下文和全局上下文返回决策。 */
export type Strategy<TItem, TContext, TDecision, TGlobalContext> =
  | StaticStrategy<TDecision>
  | DynamicStrategy<TItem, TContext, TDecision, TGlobalContext>;
