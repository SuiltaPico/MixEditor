import { MixEditor } from "../../mix_editor";
import { ChildCompo, find_child_ent_index_default, IChildCompo } from "./child";
import { ParentEntCompo } from "./parent_ent";

/**
 * 获取目标实体的实际子实体组件。
 * @param ecs_ctx ECS上下文对象
 * @param target_ent_id 需要查询的目标实体
 * @returns 实际子实体组件（未找到返回undefined）
 */
export function get_actual_child_compo(
  ecs_ctx: MixEditor["ecs"],
  target_ent_id: string
) {
  // 获取父容器的子实体组件路由
  const child_ent_route = ecs_ctx.get_compo(target_ent_id, ChildCompo.type);
  if (!child_ent_route) return undefined;

  const child_ent_src_compo_type = child_ent_route.src.get();
  if (!child_ent_src_compo_type) return undefined;

  // 获取父容器的实际子实体组件
  return ecs_ctx.get_compo(
    target_ent_id,
    child_ent_src_compo_type
  ) as IChildCompo;
}

/**
 * 获取实体在父容器中的索引位置
 * @param ecs_ctx ECS上下文对象
 * @param target_ent_id 需要查询的目标实体
 * @returns 在父容器中的索引值（未找到返回-1）
 */
export function get_index_in_parent_ent(
  ecs_ctx: MixEditor["ecs"],
  target_ent_id: string
) {
  // 获取父实体来源组件类型
  const parent_id = ecs_ctx
    .get_compo(target_ent_id, ParentEntCompo.type)
    ?.parent_id.get();
  if (!parent_id) return -1;

  // 获取父容器的实际子实体组件
  const child_ent_compo = get_actual_child_compo(ecs_ctx, parent_id);
  if (!child_ent_compo) return -1;

  // 优先使用容器的自定义索引查找方法
  return child_ent_compo.index_of
    ? child_ent_compo.index_of(target_ent_id)
    : find_child_ent_index_default(child_ent_compo, target_ent_id);
}

// ------- ChildEntCompo 相关 -------
/** 获取实体的子实体数量。*/
export function get_child_ent_count(ecs_ctx: MixEditor["ecs"], ent_id: string) {
  const child_ent_compo = get_actual_child_compo(ecs_ctx, ent_id);
  if (!child_ent_compo) return 0;

  return child_ent_compo.count();
}

/** 获取实体的子实体ID。*/
export function get_child_ent_id(
  ecs_ctx: MixEditor["ecs"],
  ent_id: string,
  index: number
) {
  const child_ent_compo = get_actual_child_compo(ecs_ctx, ent_id);
  if (!child_ent_compo) return;

  return child_ent_compo.at(index);
}
export function get_index_of_child_ent(
  ecs_ctx: MixEditor["ecs"],
  ent: string,
  maybe_child: string
) {
  // 获取父容器的实际子实体组件
  const actual_child_compo = get_actual_child_compo(ecs_ctx, ent);
  if (!actual_child_compo) return -1;

  // 优先使用容器的自定义索引查找方法
  return actual_child_compo.index_of
    ? actual_child_compo.index_of(maybe_child)
    : find_child_ent_index_default(actual_child_compo, maybe_child);
}

// ------- ParentEntCompo 相关 -------
/**
 * 获取实体的直接父实体
 * @param ecs_ctx ECS上下文对象
 * @param ent 需要查询的子实体
 * @returns 父实体或undefined
 */
export function get_parent_ent_id(ecs_ctx: MixEditor["ecs"], ent: string) {
  const parent_id = ecs_ctx
    .get_compo(ent, ParentEntCompo.type)
    ?.parent_id.get();
  if (!parent_id) return;
  return parent_id;
}
/**
 * 获取实体到根节点的路径索引数组
 * @param ecs_ctx ECS上下文对象
 * @param ent_id 目标实体
 * @returns 从根节点到当前实体的索引路径数组
 */
export async function get_ent_path(ecs_ctx: MixEditor["ecs"], ent_id: string) {
  let path_indices: number[] = [];
  let child_ent = ent_id;
  let parent_ent_id = get_parent_ent_id(ecs_ctx, ent_id);

  // 自底向上遍历父级链
  while (parent_ent_id) {
    const child_index = get_index_in_parent_ent(ecs_ctx, child_ent);
    path_indices.push(child_index ?? 0);
    child_ent = parent_ent_id;
    parent_ent_id = get_parent_ent_id(ecs_ctx, parent_ent_id);
  }
  return path_indices.reverse();
}

/** 获取节点路径和祖先节点（不包含自身） */
export async function get_ent_path_and_ancestors(
  ecs_ctx: MixEditor["ecs"],
  ent: string
) {
  let path: number[] = [];
  let ancestors: string[] = [];
  let current_child = ent;
  let current = get_parent_ent_id(ecs_ctx, ent);
  while (current) {
    const index = get_index_in_parent_ent(ecs_ctx, current_child);
    path.push(index ?? 0);
    ancestors.push(current);
    current_child = current;
    current = get_parent_ent_id(ecs_ctx, current);
  }
  return { path: path.reverse(), ancestors: ancestors.reverse() };
}

/** 比较两个节点的路径的先后顺序。
 * * 如果 path1 在 path2 之前，返回 -1；
 * * 如果 path1 在 path2 之后，返回 1；
 * * 如果 path1 和 path2 相同，返回 0。
 */
export function path_compare(path1: number[], path2: number[]) {
  const len = Math.min(path1.length, path2.length);

  // 逐个比较每个位置的索引
  for (let i = 0; i < len; i++) {
    if (path1[i] < path2[i]) return -1;
    if (path1[i] > path2[i]) return 1;
  }

  // 如果前面的索引都相同，则比较路径长度
  if (path1.length < path2.length) return -1;
  if (path1.length > path2.length) return 1;

  // 完全相同的路径
  return 0;
}

/**
 * 查找两个实体的最近公共祖先及其路径信息
 * @param ecs_ctx ECS上下文对象
 * @param ent1 第一个实体
 * @param ent2 第二个实体
 * @returns 包含公共祖先和路径信息的对象或undefined
 */
export async function get_common_ancestor_from_ent(
  ecs_ctx: MixEditor["ecs"],
  ent1: string,
  ent2: string
) {
  let common_ancestor: string | undefined;
  let common_ancestor_index: number = -1;

  // 获取第一个实体的完整路径和祖先链
  const { path: path1, ancestors: ancestors1 } =
    await get_ent_path_and_ancestors(ecs_ctx, ent1);

  // 遍历第二个实体的父级链寻找公共祖先
  let path2_indices: number[] = [];
  let ancestors2_list: string[] = [];
  let current_child = ent2;
  let current_parent = get_parent_ent_id(ecs_ctx, ent2);

  while (current_parent) {
    const child_index = get_index_in_parent_ent(ecs_ctx, current_child);
    path2_indices.push(child_index ?? 0);

    // 在第一个实体的祖先链中查找公共节点
    common_ancestor_index = ancestors1.indexOf(current_parent);
    if (common_ancestor_index !== -1) {
      common_ancestor = current_parent;
      break;
    }

    ancestors2_list.push(current_parent);
    current_child = current_parent;
    current_parent = get_parent_ent_id(ecs_ctx, current_parent);
  }

  if (!common_ancestor) return;

  // 反转路径和祖先列表以获得正确顺序
  const reversed_path2 = path2_indices.toReversed();
  const reversed_ancestors2 = ancestors2_list.toReversed();

  return {
    common_ancestor,
    path1,
    path2: path1.slice(0, common_ancestor_index).concat(reversed_path2),
    ancestors1,
    ancestors2: ancestors1
      .slice(0, common_ancestor_index + 1)
      .concat(reversed_ancestors2),
    ancestor_index: common_ancestor_index,
  };
}
