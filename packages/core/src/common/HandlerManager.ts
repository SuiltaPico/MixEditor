import { TwoLevelTypeMap } from "./TwoLevelTypeMap";
import { ParametersExceptFirst2 } from "./type";

/** 项目的处理器表 */
export type ItemHandlerMap<TContext, TItem> = Record<
  string,
  Handler<TContext, TItem>
>;

/** 处理器 */
export type Handler<TContext, TItem> = (
  context: TContext,
  item: TItem,
  ...args: any[]
) => any;

/** 项目类型 */
export type ItemOfHandlerBehavior<
  THandlerMap extends ItemHandlerMap<any, any>
> = THandlerMap extends ItemHandlerMap<any, infer TItem> ? TItem : never;

export const HandlerManagerDefaultItemType = "default";

/** 项目处理器管理器 */
export class HandlerManager<
  THandlerMap extends ItemHandlerMap<TContext, TItem>,
  TItem extends TAbstractItem,
  TAbstractItem extends { type: string },
  TContext
> {
  /** 项目处理器 */
  private handler_map = new TwoLevelTypeMap<
    THandlerMap,
    string,
    THandlerMap[keyof THandlerMap]
  >();

  /** 设置项目处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handler<THandlerName extends keyof THandlerMap>(
    item_type: string,
    handler_name: THandlerName,
    handler: THandlerMap[THandlerName]
  ) {
    this.handler_map.set(handler_name as any, item_type, handler);
  }

  /** 为所有项目注册处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handlers<
    TItemType extends
      | ItemOfHandlerBehavior<THandlerMap>["type"]
      | typeof HandlerManagerDefaultItemType,
    THandlers extends {
      [key in keyof THandlerMap]?: (
        context: TContext,
        item: TItem & { type: TItemType },
        ...args: ParametersExceptFirst2<THandlerMap[key]>
      ) => ReturnType<THandlerMap[key]>;
    }
  >(item_type: TItemType, handlers: THandlers) {
    for (const [property_name, handler] of Object.entries(handlers)) {
      this.register_handler(
        item_type,
        property_name as keyof THandlerMap,
        handler as any
      );
    }
  }

  /** 获取处理器。 */
  get_handler<THandler extends keyof THandlerMap>(
    item_type: string,
    handler_name: THandler
  ): THandlerMap[THandler] | undefined {
    let handler = this.handler_map.get(handler_name as any, item_type) as
      | THandlerMap[THandler]
      | undefined;
    if (handler === undefined) {
      handler = this.handler_map.get(
        handler_name as any,
        HandlerManagerDefaultItemType
      ) as THandlerMap[THandler] | undefined;
    }
    return handler;
  }

  /** 执行处理器。 */
  execute_handler<THandler extends keyof THandlerMap>(
    handler_name: THandler,
    item: TAbstractItem,
    ...args: ParametersExceptFirst2<THandlerMap[THandler]>
  ) {
    let handler = this.get_handler(item.type, handler_name);
    if (handler === undefined) {
      return undefined;
    }
    return (handler as any)(
      this.context,
      item,
      ...args
    ) as THandlerMap[THandler] extends (...args: any) => any
      ? ReturnType<THandlerMap[THandler]>
      : never;
  }

  constructor(public context: TContext) {}
}
