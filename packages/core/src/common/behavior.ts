import { MaybePromise } from "@mixeditor/common";
import { TwoLevelTypeMap } from "./data_struct/two_level_type_map";

/** 要记录行为的项目。 */
export interface IItem {
  type: string;
}

/** 行为处理器。 */
export type BehaviorHandler<
  TItem extends IItem,
  TParams extends object,
  TResult,
  TExCtx
> = (params: { it: TItem; ex_ctx: TExCtx } & TParams) => MaybePromise<TResult>;

type ParamsOfBehaviorHandler<
  THandler extends BehaviorHandler<any, any, any, any>
> = THandler extends BehaviorHandler<any, infer TParams, any, any>
  ? TParams
  : never;
type ResultOfBehaviorHandler<
  THandler extends BehaviorHandler<any, any, any, any>
> = THandler extends BehaviorHandler<any, any, infer TResult, any>
  ? TResult
  : never;
type ExCtxOfBehaviorHandler<
  THandler extends BehaviorHandler<any, any, any, any>
> = THandler extends BehaviorHandler<any, any, any, infer TExCtx>
  ? TExCtx
  : never;
export type TypeSpecifiedBehaviorHandler<
  TItem extends IItem,
  THandler extends BehaviorHandler<TItem, any, any, any>
> = BehaviorHandler<
  TItem,
  ParamsOfBehaviorHandler<THandler>,
  ResultOfBehaviorHandler<THandler>,
  ExCtxOfBehaviorHandler<THandler>
>;

/** 行为映射表。由行为id映射到行为处理器。 */
export interface IBehaviorMap<TItem extends IItem, TExCtx> {
  [key: string]: BehaviorHandler<TItem, any, any, TExCtx>;
}

/** 行为处理器的管理器。
 *
 * 负责管理行为处理器的注册、查询和执行。
 * @template TItem 项目类型。
 * @template TBehaviorMap 行为映射表。
 * @template TExCtx 外部上下文类型。
 */
export interface IBehaviorHandlerManager<
  TItem extends IItem,
  TBehaviorMap extends IBehaviorMap<TItem, TExCtx>,
  TItemMap extends Record<string, TItem>,
  TExCtx
> {
  /** 注册行为处理器。 */
  register_handler<
    TItemType extends Extract<keyof TItemMap, string>,
    TBehaviorId extends Extract<keyof TBehaviorMap, string>
  >(
    item_type: TItemType,
    behavior_id: TBehaviorId,
    handler: TypeSpecifiedBehaviorHandler<
      TItemMap[TItemType],
      TBehaviorMap[TBehaviorId]
    >
  ): void;
  /** 注册多个行为处理器。 */
  register_handlers<TItemType extends Extract<keyof TItemMap, string>>(
    item_type: TItemType,
    handlers: Partial<{
      [key in keyof TBehaviorMap]: TypeSpecifiedBehaviorHandler<
        TItemMap[TItemType],
        TBehaviorMap[key]
      >;
    }>
  ): void;
  /** 获取行为。 */
  get_handler<TType extends Extract<keyof TBehaviorMap, string>>(
    item_type: string,
    behavior_id: TType
  ): TBehaviorMap[TType] | undefined;
  /** 执行行为。 */
  exec_behavior<TType extends Extract<keyof TBehaviorMap, string>>(
    item: TItem,
    behavior_id: TType,
    params: Parameters<TBehaviorMap[TType]>[0]
  ): ReturnType<TBehaviorMap[TType]> | undefined;
}

export const IBehaviorHandlerManager_methods = [
  "register_handler",
  "register_handlers",
  "get_handler",
  "exec_behavior",
] satisfies (keyof IBehaviorHandlerManager<any, any, any, any>)[];

/** 行为处理器的管理器。
 *
 * 负责管理行为处理器的注册、查询和执行。
 * @template TBehaviorMap 行为映射表。
 * @template TItem 项目类型。
 * @template TItemMap 项目映射表。
 * @template TExCtx 外部上下文类型。
 */
export class BehaviorHandlerManager<
  TBehaviorMap extends IBehaviorMap<TItem, TExCtx>,
  TItem extends IItem,
  TItemMap extends Record<string, TItem>,
  TExCtx
> implements IBehaviorHandlerManager<TItem, TBehaviorMap, TItemMap, TExCtx>
{
  /** 行为处理器 */
  private behavior_map = new TwoLevelTypeMap<
    TBehaviorMap,
    string,
    TBehaviorMap[keyof TBehaviorMap]
  >();

  /** 设置项目处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handler<
    TItemType extends Extract<keyof TItemMap, string>,
    TBehaviorId extends Extract<keyof TBehaviorMap, string>
  >(
    item_type: TItemType,
    behavior_id: TBehaviorId,
    handler: TypeSpecifiedBehaviorHandler<
      TItemMap[TItemType],
      TBehaviorMap[TBehaviorId]
    >
  ) {
    this.behavior_map.set(behavior_id as any, item_type, handler as any);
  }

  /** 为所有项目注册处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handlers<TItemType extends Extract<keyof TItemMap, string>>(
    item_type: TItemType,
    handlers: Partial<{
      [key in keyof TBehaviorMap]: TypeSpecifiedBehaviorHandler<
        TItemMap[TItemType],
        TBehaviorMap[key]
      >;
    }>
  ) {
    for (const [property_name, handler] of Object.entries(handlers)) {
      this.register_handler(
        item_type,
        property_name as Extract<keyof TBehaviorMap, string>,
        handler as any
      );
    }
  }

  /** 获取处理器。 */
  get_handler<TBehaviorId extends Extract<keyof TBehaviorMap, string>>(
    item_type: string,
    behavior_id: TBehaviorId
  ): TBehaviorMap[TBehaviorId] | undefined {
    let handler = this.behavior_map.get(behavior_id as any, item_type) as
      | TBehaviorMap[TBehaviorId]
      | undefined;
    if (handler === undefined) {
      handler = this.behavior_map.get(behavior_id as any, "*") as
        | TBehaviorMap[TBehaviorId]
        | undefined;
    }
    return handler;
  }

  /** 执行行为。 */
  exec_behavior<TBehaviorId extends Extract<keyof TBehaviorMap, string>>(
    item: TItem,
    behavior_id: TBehaviorId,
    params: Omit<Parameters<TBehaviorMap[TBehaviorId]>[0], "it" | "ex_ctx">
  ) {
    const params_with_ctx = params as Parameters<TBehaviorMap[TBehaviorId]>[0];
    // 注入上下文
    params_with_ctx.it = item;
    params_with_ctx.ex_ctx = this.ex_ctx;

    let handler = this.get_handler(item.type, behavior_id);
    if (handler === undefined) return undefined;
    return handler(params_with_ctx) as ReturnType<TBehaviorMap[TBehaviorId]>;
  }
  
  constructor(public ex_ctx: TExCtx) {}
}
