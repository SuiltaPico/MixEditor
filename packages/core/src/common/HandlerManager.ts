import { TwoLevelTypeMap } from "./TwoLevelTypeMap";
import { ParametersExceptFirst2 } from "./type";

export class HandlerManagerNoHandlerError extends Error {
  constructor(public handler_name: string, public item_type: string) {
    super(`No handler for item type: ${item_type}, handler: ${handler_name}`);
  }
}

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

/** 项目处理器管理器 */
export class HandlerManager<
  THandlerMap extends ItemHandlerMap<TContext, TItem>,
  TItem extends TAbstractItem,
  TAbstractItem extends { type: string },
  TContext
> {
  static readonly default_item_type = "default";

  /** 项目处理器 */
  private handler_map = new TwoLevelTypeMap<THandlerMap>();

  /** 设置项目处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handler<THandler extends keyof THandlerMap>(
    item_type: string,
    handler_name: THandler,
    handler: THandlerMap[THandler]
  ) {
    this.handler_map.set(handler_name, item_type, handler);
  }

  /** 为所有项目注册处理器。如果项目类型为默认类型，则设置为默认处理器。 */
  register_handlers<
    TItemType extends ItemOfHandlerBehavior<THandlerMap>["type"],
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
  ): THandlerMap[THandler] {
    const handler = this.handler_map.get(handler_name, item_type);
    if (!handler) {
      throw new HandlerManagerNoHandlerError(handler_name as string, item_type);
    }
    return handler as THandlerMap[THandler];
  }

  /** 执行处理器。 */
  execute_handler<THandler extends keyof THandlerMap>(
    handler_name: THandler,
    item: TAbstractItem,
    ...args: ParametersExceptFirst2<THandlerMap[THandler]>
  ) {
    let handler: THandlerMap[THandler] | undefined = this.get_handler(
      item.type,
      handler_name
    );
    if (!handler) {
      handler = this.get_handler(
        HandlerManager.default_item_type,
        handler_name
      ) as THandlerMap[THandler] | undefined;
      if (!handler) {
        throw new HandlerManagerNoHandlerError(
          handler_name as string,
          item.type
        );
      }
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
