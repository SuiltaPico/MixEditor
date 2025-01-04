import { Graph } from "./common/Graph";
import { MaybePromise } from "./common/promise";

/** 事件。 */
export interface Event {
  /** 事件类型。 */
  event_type: string;
  /** 事件附带的上下文，可以用于传递数据。 */
  context?: Record<string, any> & {
    /** 事件处理的返回结果。 */
    result?: any;
  };
}

/** 事件监听器。*/
export type EventHandler = (props: {
  /** 事件。*/
  event: Event;
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
  private handler_relation_map = new Map<string, Graph<EventHandler>>();

  /** 检查 `ancestor_handler` 是否是 `child_handler` 的祖先。*/
  private has_ancestor_handler(
    event_type: string,
    ancestor_handler: EventHandler,
    child_handler: EventHandler
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
  add_handler(
    event_type: string,
    handler: EventHandler,
    dependencies?: Iterable<EventHandler>
  ) {
    // 获取或创建关系映射表
    if (!this.handler_relation_map.has(event_type)) {
      this.handler_relation_map.set(event_type, new Graph());
    }
    const relation_graph = this.handler_relation_map.get(event_type)!;

    if (dependencies) {
      // 检查依赖关系是否会导致循环依赖
      for (const dependency of dependencies) {
        if (this.has_ancestor_handler(event_type, handler, dependency)) {
          throw new Error(
            `已存在依赖关系: ${dependency.name} -> ${handler.name}，无法添加依赖关系 ${handler.name} -> ${dependency.name}。`
          );
        }
      }

      // 添加依赖关系
      for (const dependency of dependencies) {
        relation_graph.add_relation(dependency, handler);
      }
    }

    relation_graph.add_item(handler);
  }

  /** 移除监听器。*/
  remove_handler(event_type: string, handler: EventHandler) {
    const relation_map = this.handler_relation_map.get(event_type);
    if (relation_map) {
      relation_map.delete_item(handler);
      // 如果关系映射表为空，则删除整个映射
      if (relation_map.size() === 0) {
        this.handler_relation_map.delete(event_type);
      }
    }
  }

  /** 触发事件。*/
  async emit<T extends TEvent>(event: T) {
    const event_type = event.event_type;

    const relation_graph = this.handler_relation_map.get(event_type)!;
    const handlers = relation_graph.get_items();

    const promise_map = new Map<EventHandler, PromiseWithResolvers<void>>();
    for (const handler of handlers) {
      promise_map.set(handler, Promise.withResolvers<void>());
    }

    const results = await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler({
            event,
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
      })
    );
    return { context: event.context, results };
  }

  constructor() {}
}
