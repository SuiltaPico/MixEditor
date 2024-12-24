import { BiRelationMap } from "../common/BiRelationMap";

/** 标签管理器。
 * 标签管理器用于管理标签的继承关系，以及 `TKey` 和其标签集合之间的映射关系。
 * 标签之间的关系构成一个有向无环图。
 */
export class TagManager<TKey> {
  /** 存储节点类型和其标签集合的映射关系。
   * key 是节点类型，value 是标签集合。
   */
  private node_type_tag_map: Map<TKey, Set<string>> = new Map();

  /** 存储标签继承关系的图。
   * key 是父标签，value 是子标签集合。
   */
  private tag_relations: BiRelationMap<string> = new BiRelationMap();

  // ---- tag 关系构建 ----

  /** 添加标签继承关系。*/
  add_tag_relation(parent_tag: string, child_tag: string) {
    // 检测循环继承，不允许 child_tag 是 parent_tag 的祖先
    if (this.has_ancestor_tag(child_tag, parent_tag)) {
      throw new Error(`检测到循环继承: ${parent_tag} -> ${child_tag}`);
    }
    // 记录继承关系
    return this.tag_relations.set(parent_tag, child_tag);
  }

  /** 移除标签继承关系。*/
  remove_tag_relation(parent_tag: string, child_tag: string) {
    return this.tag_relations.delete_relation(parent_tag, child_tag);
  }

  /** 移除标签。*/
  remove_tag(tag: string) {
    // 删除该标签与其他标签的所有关系
    this.tag_relations.delete_item(tag);

    // 从所有节点的标签集合中删除该标签
    for (const tags of this.node_type_tag_map.values()) {
      tags.delete(tag);
    }
  }

  /** 检查 `ancestor_tag` 是否是 `child_tag` 的祖先。*/
  has_ancestor_tag(ancestor_tag: string, child_tag: string) {
    // 使用栈进行深度优先搜索
    for (const parent of this.get_tag_ancestors(child_tag)) {
      if (parent === ancestor_tag) return true;
    }
    // 未找到目标祖先标签
    return false;
  }

  /** 获取 `tag` 的所有父标签。*/
  get_tag_parents(tag: string) {
    return this.tag_relations.get_parents(tag);
  }

  /** 获取 `tag` 的所有子标签。*/
  get_tag_children(tag: string) {
    return this.tag_relations.get_children(tag);
  }

  /** 获取 `tag` 的所有祖先标签。*/
  get_tag_ancestors(tag: string) {
    return this.tag_relations.get_ancestors(tag);
  }

  /** 获取 `tag` 的所有后代标签。*/
  get_tag_descendants(tag: string) {
    return this.tag_relations.get_descendants(tag);
  }

  // ---- tag 和 key 关系的构建 ----

  /** 设置 `key` 的标签集合。*/
  set_tags_of_key(key: TKey, tags: Set<string>) {
    // 过滤掉被其子标签覆盖的祖先标签
    const filtered_tags = new Set<string>();

    for (const tag of tags) {
      let should_add = true;

      // 检查该标签的所有子孙标签
      const stack = [tag];
      const visited = new Set<string>();

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const children = this.tag_relations.get_children(current);
        if (children) {
          for (const child of children) {
            if (tags.has(child)) {
              // 如果发现任何子孙标签在集合中，就不添加当前标签
              should_add = false;
              break;
            }
            stack.push(child);
          }
        }
        if (!should_add) break;
      }

      if (should_add) filtered_tags.add(tag);
    }

    this.node_type_tag_map.set(key, filtered_tags);
  }

  /** 获取 `key` 的标签集合。*/
  get_tags_of_key(key: TKey) {
    return this.node_type_tag_map.get(key);
  }

  /** 检查 `key` 是否具有 `tag`。*/
  check_tag_of_key(key: TKey, tag: string): boolean {
    const tags = this.node_type_tag_map.get(key);

    if (!tags) return false;
    // 检查是否直接包含该标签
    if (tags.has(tag)) return true;

    // 检查是否包含该标签的任何子标签
    const stack = [...(this.tag_relations.get_children(tag) ?? [])];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      if (tags.has(current)) return true;
      const children = this.tag_relations.get_children(current);
      if (children) {
        stack.push(...children);
      }
    }
    return false;
  }

  /** 删除 `key`。*/
  delete_key(key: TKey) {
    this.node_type_tag_map.delete(key);
  }

  /** 删除 `tag`。*/
  delete_tag_of_key(key: TKey, tag: string) {
    const tags = this.node_type_tag_map.get(key);
    if (!tags) return;
    tags.delete(tag);
  }
}
