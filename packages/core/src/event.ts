import { Graph } from "./common/Graph";
import { MaybePromise } from "@mixeditor/common";

/** 事件。 */
export interface Event {
  /** 事件类型。 */
  type: string;
  /** 事件附带的上下文，可以用于传递数据。 */
  context?: Record<string, any> & {
    /** 事件处理的返回结果。 */
    result?: any;
  };
}

/** 事件。 */
export interface EventForEmit {
  /** 事件类型。 */
  type: string;
  /** 事件附带的上下文，可以用于传递数据。 */
  context: Record<string, any> & {
    /** 事件处理的返回结果。 */
    result?: any;
  };
}

export type EventToEventForEmit<TEvent extends Event> = Omit<
  TEvent,
  "context"
> & {
  context: Exclude<TEvent["context"], undefined>;
};

/** 事件监听器。*/
export type EventHandler<TEvent extends Event = any> = (props: {
  /** 事件。*/
  event: EventToEventForEmit<TEvent>;
  /** 等待依赖的处理器完成。*/
  wait_dependencies: () => Promise<any>;
}) => MaybePromise<void>;

/** 事件管理器。
 *
 * ## 监听器
 * 监听器之间的依赖关系构成一个有向无环图。
 */
export class EventManager<TEvent extends Event> {
  /** 监听器到监听器节点的映射。*/
  private handler_relation_map = new Map<string, Graph<EventHandler<TEvent>>>();

  /** 检查 `ancestor_handler` 是否是 `child_handler` 的祖先。*/
  private has_ancestor_handler(
    event_type: string,
    ancestor_handler: EventHandler<TEvent>,
    child_handler: EventHandler<TEvent>
  ) {
    const relation_graph = this.handler_relation_map.get(event_type);
    if (!relation_graph) return false;
    // 使用栈进行深度优先搜索
    for (const parent of relation_graph.get_ancestors(child_handler)) {
      if (parent === ancestor_handler) return true;
    }
    // 未找到目标祖先标签
    return false;
  }

  /** 添加监听器。*/
  add_handler<TEventType extends TEvent["type"]>(
    type: TEventType,
    handler: EventHandler<
      TEvent & {
        type: TEventType;
      }
    >,
    dependencies?: Iterable<EventHandler<TEvent>>
  ) {
    const _handler = handler as EventHandler<TEvent>;

    // 获取或创建关系映射表
    if (!this.handler_relation_map.has(type)) {
      this.handler_relation_map.set(type, new Graph());
    }
    const relation_graph = this.handler_relation_map.get(type)!;

    if (dependencies) {
      // 检查依赖关系是否会导致循环依赖
      for (const dependency of dependencies) {
        if (this.has_ancestor_handler(type, _handler, dependency)) {
          throw new Error(
            `已存在依赖关系: ${dependency.name} -> ${_handler.name}，无法添加依赖关系 ${handler.name} -> ${dependency.name}。`
          );
        }
      }

      // 添加依赖关系
      for (const dependency of dependencies) {
        relation_graph.add_relation(dependency, _handler);
      }
    }

    relation_graph.add_item(_handler);
  }

  /** 移除监听器。*/
  remove_handler<TEventType extends TEvent["type"]>(
    event_type: TEventType,
    handler: EventHandler<
      TEvent & {
        event_type: TEventType;
      }
    >
  ) {
    const _handler = handler as EventHandler<TEvent>;
    const relation_map = this.handler_relation_map.get(event_type);
    if (relation_map) {
      relation_map.delete_item(_handler);
      // 如果关系映射表为空，则删除整个映射
      if (relation_map.size() === 0) {
        this.handler_relation_map.delete(event_type);
      }
    }
  }

  /** 触发事件。*/
  async emit(
    event: TEvent,
    options?: {
      /** 是否快速失败。
       * 如果为 true，则一旦有处理器抛出错误，则立即向上传递错误。
       * 如果为 false，则等待所有处理器执行完毕。
       */
      fast_fail?: boolean;
    }
  ) {
    const event_type = event.type;

    const relation_graph = this.handler_relation_map.get(event_type);
    if (!relation_graph) {
      return { context: event.context };
    }

    const handlers = relation_graph.get_items();

    const promise_map = new Map<
      EventHandler<TEvent>,
      PromiseWithResolvers<void>
    >();
    for (const handler of handlers) {
      promise_map.set(handler, Promise.withResolvers<void>());
    }

    const fast_fail = options?.fast_fail ?? false;

    if (!event.context) {
      event.context = {};
    }

    const promises = handlers.map(async (handler) => {
      try {
        await handler({
          event: event as any as EventToEventForEmit<TEvent>,
          wait_dependencies: () => {
            const parents = relation_graph.get_parents(handler);
            if (!parents) return Promise.resolve();
            return Promise.all(
              parents.map((parent) => promise_map.get(parent)!.promise)
            );
          },
        });
        promise_map.get(handler)!.resolve();
      } catch (error) {
        promise_map.get(handler)!.reject(error);
      }
    });

    if (fast_fail) {
      await Promise.all(promises);
    } else {
      await Promise.allSettled(promises);
    }
    return { context: event.context };
  }

  constructor() {}
}
