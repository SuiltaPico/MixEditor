/** 双向关系映射表。*/
export class BiRelationMap<T> {
  /** 子节点到父节点的映射。*/
  private children: Map<T, Set<T>> = new Map();
  /** 父节点到子节点的映射。*/
  private parents: Map<T, Set<T>> = new Map();

  /** 添加关系: parent -> child */
  set(parent: T, child: T): this {
    // 处理 children 映射
    if (!this.children.has(parent)) {
      this.children.set(parent, new Set());
    }
    this.children.get(parent)!.add(child);
    // 处理 parents 映射
    if (!this.parents.has(child)) {
      this.parents.set(child, new Set());
    }
    this.parents.get(child)!.add(parent);
    return this;
  }

  /** 获取节点的所有子节点。*/
  get_children(node: T): Set<T> | undefined {
    return this.children.get(node);
  }

  /** 获取节点的所有父节点。*/
  get_parents(node: T): Set<T> | undefined {
    return this.parents.get(node);
  }

  /** 获取 `tag` 的所有祖先标签。*/
  *get_ancestors(item: T): Generator<T> {
    // 使用栈进行深度优先搜索
    const stack = [item];
    const visited = new Set<T>();

    while (stack.length > 0) {
      const current = stack.pop()!;
      // 跳过已访问的标签
      if (visited.has(current)) continue;
      visited.add(current);

      // 获取当前标签的所有父标签
      const parents = this.parents.get(current);
      if (parents) {
        // 将所有父标签加入栈中继续搜索
        stack.push(...parents);
        // 逐个返回父标签
        for (const parent of parents) {
          yield parent;
        }
      }
    }
  }

  /** 获取 `tag` 的所有后代标签。*/
  *get_descendants(item: T): Generator<T> {
    // 使用栈进行深度优先搜索
    const stack = [item];
    const visited = new Set<T>();

    while (stack.length > 0) {
      const current = stack.pop()!;
      // 跳过已访问的标签
      if (visited.has(current)) continue;
      visited.add(current);

      // 获取当前标签的所有子标签
      const children = this.children.get(current);
      if (children) {
        // 将所有子标签加入栈中继续搜索
        stack.push(...children);
        // 逐个返回子标签
        for (const child of children) {
          yield child;
        }
      }
    }
  }

  /** 删除指定的关系。*/
  delete_relation(parent: T, child: T) {
    const children_set = this.children.get(parent);
    const parents_set = this.parents.get(child);
    let deleted = false;
    if (children_set?.delete(child)) {
      deleted = true;
      if (children_set.size === 0) {
        this.children.delete(parent);
      }
    }
    if (parents_set?.delete(parent)) {
      deleted = true;
      if (parents_set.size === 0) {
        this.parents.delete(child);
      }
    }
    return deleted;
  }

  delete_item(item: T) {
    // 获取 item 的所有子节点和父节点
    const children_set = this.children.get(item);
    const parents_set = this.parents.get(item);
    // 从所有子节点的 parents 集合中删除 item
    if (children_set) {
      for (const child of children_set) {
        const childParents = this.parents.get(child);
        childParents?.delete(item);
        if (childParents?.size === 0) {
          this.parents.delete(child);
        }
      }
    }
    // 从所有父节点的 children 集合中删除 item
    if (parents_set) {
      for (const parent of parents_set) {
        const parentChildren = this.children.get(parent);
        parentChildren?.delete(item);
        if (parentChildren?.size === 0) {
          this.children.delete(parent);
        }
      }
    }
    // 删除 item 的映射
    this.children.delete(item);
    this.parents.delete(item);
  }

  /** 检查关系是否存在。*/
  has_relation(parent: T, child: T): boolean {
    return this.children.get(parent)?.has(child) ?? false;
  }

  /** 检查节点是否存在。*/
  has_item(item: T): boolean {
    return this.children.has(item) || this.parents.has(item);
  }

  /** 获取所有有子节点的节点。*/
  get_items_with_children() {
    return this.children.keys();
  }

  /** 获取所有有父节点的节点。*/
  get_items_with_parents() {
    return this.parents.keys();
  }

  /** 清空所有关系。*/
  clear(): void {
    this.children.clear();
    this.parents.clear();
  }
}
