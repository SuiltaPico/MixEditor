import { BiRelationMap } from "./BiRelationMap";

export class Graph<T> extends BiRelationMap<T> {
  /** 节点。 */
  nodes = new Set<T>();

  /** 添加节点。 */
  add_item(item: T) {
    this.nodes.add(item);
  }

  /** 添加关系。 */
  add_relation(parent: T, child: T) {
    super.add_relation(parent, child);
    this.nodes.add(parent);
    this.nodes.add(child);
  }

  /** 删除节点及其关系 */
  delete_item(item: T) {
    super.delete_item(item);
    this.nodes.delete(item);
  }

  /** 获取所有节点。 */
  get_items() {
    return [...this.nodes];
  }

  /** 检查节点是否存在。 */
  has_item(item: T) {
    return this.nodes.has(item);
  }

  /** 清空图 */
  clear(): void {
    super.clear();
    this.nodes.clear();
  }

  size() {
    return this.nodes.size;
  }

  constructor() {
    super();
  }
}
