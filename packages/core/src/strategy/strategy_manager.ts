import { TwoLevelTypeMap } from "../common/data_struct/two_level_type_map";
import { Strategy } from "./strategy";

export const strategy_manager_method_list = [
  "register_strategy",
  "register_strategies",
  "get_strategy",
  "get_decision",
] as const;

/** 策略表规范 */
export type NameToStrategyMap = Record<string, { context: any; decision: any }>;

/** 策略简写 */
type StrategyManagerStrategy<
  TItem extends { nodeName: string },
  TNameToStrategyMap extends NameToStrategyMap,
  TGlobalContext
> = Strategy<
  TItem,
  TNameToStrategyMap[keyof TNameToStrategyMap]["context"],
  TNameToStrategyMap[keyof TNameToStrategyMap]["decision"],
  TGlobalContext
>;

/** 策略管理器。 */
export class StrategyManager<
  TItem extends { nodeName: string },
  TNameToStrategyMap extends NameToStrategyMap,
  TGlobalContext = any
> {
  private strategy_map = new TwoLevelTypeMap<
    TItem["nodeName"],
    keyof TNameToStrategyMap,
    StrategyManagerStrategy<TItem, TNameToStrategyMap, TGlobalContext>
  >();

  /** 注册策略。 */
  register_strategy(
    item_type: TItem["nodeName"],
    strategy_name: keyof TNameToStrategyMap,
    strategy: StrategyManagerStrategy<TItem, TNameToStrategyMap, TGlobalContext>
  ) {
    this.strategy_map.set(item_type, strategy_name, strategy);
  }

  /** 为所有项目注册策略。 */
  register_strategies<TItemType extends TItem["nodeName"]>(
    item_type: TItemType,
    strategies: Partial<{
      [key in keyof TNameToStrategyMap]: Strategy<
        TItem & { type: TItemType },
        TNameToStrategyMap[key]["context"],
        TNameToStrategyMap[key]["decision"],
        TGlobalContext
      >;
    }>
  ) {
    for (const [strategy_name, strategy] of Object.entries(strategies)) {
      this.register_strategy(
        item_type,
        strategy_name as keyof TNameToStrategyMap,
        strategy
      );
    }
  }

  /** 获取策略。 */
  get_strategy<TStrategyName extends keyof TNameToStrategyMap>(
    strategy_name: TStrategyName,
    item: TItem
  ):
    | StrategyManagerStrategy<TItem, TNameToStrategyMap, TGlobalContext>
    | undefined {
    return this.strategy_map.get(item.nodeName, strategy_name);
  }

  /** 获取决策。 */
  async get_decision<TStrategyName extends keyof TNameToStrategyMap>(
    strategy_name: TStrategyName,
    item: TItem,
    context: TNameToStrategyMap[TStrategyName]["context"]
  ) {
    const strategy = this.get_strategy(strategy_name, item);
    if (!strategy) return undefined;
    if (strategy.type === "static") {
      return strategy.value as TNameToStrategyMap[TStrategyName]["decision"];
    } else {
      return (await strategy.decision(this.context, item, context)) as
        | TNameToStrategyMap[TStrategyName]["decision"]
        | undefined;
    }
  }

  constructor(public context: TGlobalContext) {}
}
