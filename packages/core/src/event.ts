import { BiRelationMap } from "./common/BiRelationMap";

export interface Event {
  event_type: string;
}

/** 事件监听器。*/
export type EventHandler = (event: Event) => void;

/** 事件管理器。
 *
 * ## 监听器
 * 监听器之间的依赖关系构成一个有向无环图。
 */
export class EventManager {
  /** 监听器到监听器节点的映射。*/
  private handler_relation_map = new Map<string, BiRelationMap<EventHandler>>();
  /** 监听器触发顺序的缓存。在 emit 时构建，添加或删除监听器时清空。 */
  private handler_order_cache_map = new Map<string, EventHandler[]>();

  /** 检查 `ancestor_handler` 是否是 `child_handler` 的祖先。*/
  private has_ancestor_handler(
    event_type: string,
    ancestor_handler: EventHandler,
    child_handler: EventHandler
  ) {
    const relation_map = this.handler_relation_map.get(event_type);
    if (!relation_map) return false;
    // 使用栈进行深度优先搜索
    for (const parent of relation_map.get_ancestors(child_handler)) {
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
      this.handler_relation_map.set(event_type, new BiRelationMap());
    }
    const relation_map = this.handler_relation_map.get(event_type)!;

    if (dependencies) {
      // 检查依赖关系是否会导致循环依赖
      for (const dependency of dependencies) {
        if (this.has_ancestor_handler(event_type, handler, dependency)) {
          throw new Error("检测到循环依赖关系");
        }
      }

      // 添加依赖关系
      for (const dependency of dependencies) {
        relation_map.set(dependency, handler);
      }
    }

    // 清除缓存
    this.handler_order_cache_map.delete(event_type);
  }

  /** 移除监听器。*/
  remove_handler(event_type: string, handler: EventHandler) {
    const relation_map = this.handler_relation_map.get(event_type);
    if (relation_map) {
      relation_map.delete_item(handler);
      // 如果关系映射表为空，则删除整个映射
      if (!relation_map.has_item(handler)) {
        this.handler_relation_map.delete(event_type);
      }
    }
    // 清除缓存
    this.handler_order_cache_map.delete(event_type);
  }

  /** 生成事件的监听器触发顺序。*/
  private generate_handler_order(event_type: string): EventHandler[] {
    const relation_map = this.handler_relation_map.get(event_type);
    if (!relation_map) return [];

    const result: EventHandler[] = [];
    const visited = new Set<EventHandler>();
    const temp = new Set<EventHandler>();

    // 深度优先搜索进行拓扑排序
    const visit = (handler: EventHandler) => {
      if (temp.has(handler)) {
        throw new Error("检测到循环依赖关系");
      }
      if (visited.has(handler)) return;

      temp.add(handler);
      const children = relation_map.get_children(handler);
      if (children) {
        for (const child of children) {
          visit(child);
        }
      }
      temp.delete(handler);
      visited.add(handler);
      result.push(handler);
    };

    // 遍历所有没有父节点的处理器（入度为0的节点）
    for (const handler of relation_map.get_items_with_parents()) {
      if (!relation_map.get_parents(handler)) {
        visit(handler);
      }
    }

    return result;
  }

  /** 触发事件。*/
  emit<T extends Event>(event: T) {
    const event_type = event.event_type;

    // 获取或生成处理器顺序
    if (!this.handler_order_cache_map.has(event_type)) {
      this.handler_order_cache_map.set(
        event_type,
        this.generate_handler_order(event_type)
      );
    }

    // 按顺序触发处理器
    const handlers = this.handler_order_cache_map.get(event_type)!;
    for (const handler of handlers) {
      handler(event);
    }
  }

  constructor() {}
}
