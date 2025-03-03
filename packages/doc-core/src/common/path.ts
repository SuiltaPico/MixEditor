import { Ent, EntCtx, MixEditor } from "@mixeditor/core";

export function get_parent(ent_ctx: MixEditor["ent"], ent: Ent) {
  return ent_ctx.get_domain_ctx("doc", ent)?.parent;
}

/** 获取节点路径 */
export async function get_ent_path(ent_ctx: MixEditor["ent"], ent: Ent) {
  let result: number[] = [];
  let current_child = ent;
  let current = get_parent(ent_ctx, ent);
  while (current) {
    const index = await ent_ctx.exec_behavior(current, "doc:index_of_child", {
      child: current_child,
    });
    result.push(index ?? 0);
    current_child = current;
    current = get_parent(ent_ctx, current);
  }
  return result.reverse();
}

/** 获取节点路径和祖先节点（不包含自身） */
export async function get_ent_path_and_ancestors(
  ent_ctx: MixEditor["ent"],
  ent: Ent
) {
  let path: number[] = [];
  let ancestors: Ent[] = [];
  let current_child = ent;
  let current = get_parent(ent_ctx, ent);
  while (current) {
    const index = await ent_ctx.exec_behavior(current, "get_index_of_child", {
      child: current_child,
    });
    path.push(index ?? 0);
    ancestors.push(current);
    current_child = current;
    current = get_parent(ent_ctx, current);
  }
  return { path: path.reverse(), ancestors: ancestors.reverse() };
}

/** 获取节点的公共祖先节点，和节点的路径 */
export async function get_common_ancestor_from_ent(
  ent_ctx: MixEditor["ent"],
  ent1: Ent,
  ent2: Ent
) {
  let common_ancestor: Ent | undefined;
  let ancestor_index_of_ent1: number = -1;

  // 直接获取 node1 的路径
  const { path: path1, ancestors: ancestors1 } =
    await get_ent_path_and_ancestors(ent_ctx, ent1);

  // 获取 node2 的路径，直接在查找公共祖先节点的同时收集路径
  let path2: number[] = [];
  let ancestors2: Ent[] = [];
  let current_child = ent2;
  let current = get_parent(ent_ctx, ent2);
  // 后-先的遍历
  while (current) {
    const index = await ent_ctx.exec_behavior(current, "doc:index_of_child", {
      child: current_child,
    });
    path2.push(index ?? 0);

    ancestor_index_of_ent1 = ancestors1.indexOf(current!);
    if (ancestor_index_of_ent1 !== -1) {
      common_ancestor = current;
      break;
    }

    ancestors2.push(current);
    current_child = current;
    current = get_parent(ent_ctx, current);
  }

  if (!common_ancestor) return;

  // 后-先 -> 先-后
  path2 = path2.toReversed();
  ancestors2 = ancestors2.toReversed();

  return {
    common_ancestor,
    path1,
    path2: path1.slice(0, ancestor_index_of_ent1).concat(path2),
    ancestors1,
    ancestors2: ancestors1
      .slice(0, ancestor_index_of_ent1 + 1)
      .concat(ancestors2),
    ancestor_index: ancestor_index_of_ent1,
  };
}
