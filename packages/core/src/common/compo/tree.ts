import {
  TreeInsertChildrenCb,
  TreeSplitInCb,
  TreeSplitOutCb,
} from "../../core";
import {
  ChildCompo,
  find_child_ent_index_default,
  IChildCompo,
} from "../../core/compo/tree/child";
import { ParentCompo } from "../../core/compo/tree/parent";
import { MixEditor } from "../../core/mix_editor";
import { Compo } from "../../ecs";
import { clone_compo } from "./base";

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
    .get_compo(target_ent_id, ParentCompo.type)
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
 * 为子节点设置父引用
 * @param children 子节点ID列表
 * @param parent_id 父节点ID
 * @param ex_ctx 执行上下文
 */
export function set_children_parent_refs(
  ecs_ctx: MixEditor["ecs"],
  children: string[],
  parent_id: string
) {
  for (const child of children) {
    const parent_compo = ecs_ctx.get_compo(child, ParentCompo.type);
    if (!parent_compo) {
      ecs_ctx.set_compos(child, [new ParentCompo(parent_id)]);
    } else {
      parent_compo.parent_id.set(parent_id);
    }
  }
}

/**
 * 获取实体的直接父实体
 * @param ecs_ctx ECS上下文对象
 * @param ent 需要查询的子实体
 * @returns 父实体或undefined
 */
export function get_parent_ent_id(ecs_ctx: MixEditor["ecs"], ent: string) {
  const parent_id = ecs_ctx.get_compo(ent, ParentCompo.type)?.parent_id.get();
  if (!parent_id) return;
  return parent_id;
}

/**
 * 获取实体到根节点的路径索引数组
 * @param ecs_ctx ECS上下文对象
 * @param ent_id 目标实体
 * @returns 从根节点到当前实体的索引路径数组
 */
export function get_ent_path(ecs_ctx: MixEditor["ecs"], ent_id: string) {
  let path_indices: number[] = [];
  let child_ent = ent_id;
  let parent_ent_id = get_parent_ent_id(ecs_ctx, ent_id);

  // 自底向上遍历父级链
  while (parent_ent_id) {
    const child_index = get_index_in_parent_ent(ecs_ctx, child_ent);
    path_indices.push(child_index);
    child_ent = parent_ent_id;
    parent_ent_id = get_parent_ent_id(ecs_ctx, parent_ent_id);
  }
  return path_indices.reverse();
}

/** 获取节点路径和祖先节点（包含自身）
 * * 返回值的 path 数组中，第一个元素是根实体到下一个实体的索引，最后一个元素是目标实体父节点到目标实体的索引。
 * * 返回值的 ancestors 数组中，第一个是根实体，最后一个元素是目标实体。
 *
 * 关系如下所示，定义 `n = path.length - 1`：
 * ```
 * ancestors[0] --(path[0])-->
 * ancestors[1] --(path[1])-->
 * ...
 * ancestors[n] --(path[n])-->
 * ancestors[n + 1]
 * ```
 */
export function get_ent_path_and_ancestors(
  ecs_ctx: MixEditor["ecs"],
  ent: string
) {
  let path: number[] = [];
  let ancestors: string[] = [ent];
  let current_child = ent;
  let current = get_parent_ent_id(ecs_ctx, ent);
  while (current) {
    const index = get_index_in_parent_ent(ecs_ctx, current_child);
    path.push(index);
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

export enum Relation {
  /** 两个实体相等。 */
  Equal = "equal",
  /** 实体1是实体2的祖先。 */
  Ent1IsAncestorOfEnt2 = "ent1_is_ancestor_of_ent2",
  /** 实体2是实体1的祖先。 */
  Ent2IsAncestorOfEnt1 = "ent2_is_ancestor_of_ent1",
  /** 两个实体没有关系。 */
  None = "none",
}

/** 查找两个实体的最近公共祖先及其路径信息。
 */
export function get_lca_of_ent(
  ecs_ctx: MixEditor["ecs"],
  ent1: string,
  ent2: string
) {
  // 处理两个实体相同的情况
  if (ent1 === ent2) {
    const { path, ancestors } = get_ent_path_and_ancestors(ecs_ctx, ent1);
    return {
      lca: ent1,
      path1: path,
      path2: path,
      ancestors1: ancestors,
      ancestors2: ancestors,
      lca_index: ancestors.length - 1,
      relation: Relation.Equal,
    };
  }

  let lca: string | undefined;
  let lca_index: number = -1;

  // 获取第一个实体的完整路径和祖先链
  const { path: path1, ancestors: ancestors1 } = get_ent_path_and_ancestors(
    ecs_ctx,
    ent1
  );

  // 先检查ent1是否就是ent2的某个祖先
  if (ent1 === get_parent_ent_id(ecs_ctx, ent2)) {
    // ent1是ent2的直接父级
    lca = ent1;
    lca_index = ancestors1.length - 1;
    const child_index = get_index_in_parent_ent(ecs_ctx, ent2);
    return {
      lca,
      path1,
      path2: [...path1, child_index],
      ancestors1,
      ancestors2: [...ancestors1, ent2],
      lca_index,
      relation: Relation.Ent1IsAncestorOfEnt2,
    };
  }

  // 遍历第二个实体的父级链寻找公共祖先
  let path2_indices: number[] = [];
  let ancestors2_list: string[] = [ent2];
  let current_child = ent2;
  let current_parent = get_parent_ent_id(ecs_ctx, ent2);

  // 先检查ent2是否就是ent1的某个祖先
  lca_index = ancestors1.indexOf(ent2);
  if (lca_index !== -1) {
    lca = ent2;
    return {
      lca,
      path1,
      path2: path1.slice(0, lca_index + 1),
      ancestors1,
      ancestors2: [ent2],
      lca_index,
      relation: Relation.Ent2IsAncestorOfEnt1,
    };
  }

  while (current_parent) {
    const child_index = get_index_in_parent_ent(ecs_ctx, current_child);
    if (child_index >= 0) {
      path2_indices.push(child_index);
    }

    // 自下而上遍历第二个实体的祖先链，尝试在第一个实体的祖先链中查找相同父节点
    lca_index = ancestors1.indexOf(current_parent);
    if (lca_index !== -1) {
      lca = current_parent;
      break;
    }

    ancestors2_list.push(current_parent);
    current_child = current_parent;
    current_parent = get_parent_ent_id(ecs_ctx, current_parent);
  }

  if (!lca) return;

  // 反转路径和祖先列表以获得正确顺序
  const reversed_path2 = path2_indices.toReversed();
  const reversed_ancestors2 = ancestors2_list.toReversed();

  return {
    lca,
    /** 从根节点到 `ent1` 的路径索引列表。 */
    path1,
    /** 从根节点到 `ent2` 的路径索引列表。 */
    path2: path1.slice(0, lca_index).concat(reversed_path2),
    /** 从根节点到 `ent1` 的祖先列表，包含 `ent1` 自身。 */
    ancestors1,
    /** 从根节点到 `ent2` 的祖先列表，包含 `ent2` 自身。 */
    ancestors2: ancestors1.slice(0, lca_index + 1).concat(reversed_ancestors2),
    /** 从根节点到 `ent1` 和 `ent2` 的最近公共祖先的位于 `ancestors` 中的索引。 */
    lca_index,
    relation: Relation.None,
  };
}

/** 处理两个路径之间的所有最浅层节点。*/
export function process_shallow_nodes(
  ecs: MixEditor["ecs"],
  start_ent: string,
  start_offset: number,
  end_ent: string,
  end_offset: number,
  processor: (node: string, start_offset: number, end_offset: number) => void
) {
  const common_ancestor = get_lca_of_ent(ecs, start_ent, end_ent);
  // 如果两个实体没有公共祖先，则无解
  if (!common_ancestor) return;

  const {
    path1: start_path,
    path2: end_path,
    ancestors1: start_ancestors,
    ancestors2: end_ancestors,
    lca_index,
    relation,
    lca,
  } = common_ancestor;

  if (relation === Relation.Equal) {
    processor(start_ent, start_offset, end_offset);
  } else if (relation === Relation.Ent1IsAncestorOfEnt2) {
    // start_ent 是 end_ent 的祖先
    // 处理 start_ent
    processor(start_ent, start_offset, end_path[lca_index]);

    // 处理从 start_ent 到 end_ent 的路径上的中间节点
    for (let i = lca_index + 1; i < end_ancestors.length - 1; i++) {
      processor(end_ancestors[i], 0, end_path[i]);
    }

    // 处理 end_ent
    processor(end_ent, 0, end_offset);
  } else if (relation === Relation.Ent2IsAncestorOfEnt1) {
    // end_ent 是 start_ent 的祖先
    // 处理 start_ent
    processor(start_ent, start_offset, Number.MAX_SAFE_INTEGER);

    // 处理从 start_ent 到 end_ent 的路径上的中间节点
    for (let i = lca_index + 1; i < start_ancestors.length - 1; i++) {
      processor(start_ancestors[i], start_path[i] + 1, Number.MAX_SAFE_INTEGER);
    }

    // 处理 end_ent
    processor(end_ent, start_path[lca_index] + 1, end_offset);
  } else {
    process_lca_child_to_start_ent();
    process_lca_child_to_end_ent();
    process_lca_child_between_start_and_end();
  }

  function process_lca_child_to_start_ent() {
    // 处理 start_ent 的 (lca, start_ent) 之间的祖先
    for (let i = lca_index + 1; i < start_ancestors.length - 1; i++) {
      processor(start_ancestors[i], start_path[i] + 1, Number.MAX_SAFE_INTEGER);
    }
    // 处理 start_ent
    processor(start_ent, start_offset, Number.MAX_SAFE_INTEGER);
  }

  function process_lca_child_to_end_ent() {
    // 处理 end_ent 的 (lca, end_ent) 之间的祖先
    for (let i = lca_index + 1; i < end_ancestors.length - 1; i++) {
      processor(end_ancestors[i], 0, end_path[i]);
    }
    // 处理 end_ent
    processor(end_ent, 0, end_offset);
  }

  function process_lca_child_between_start_and_end() {
    // 处理 start_ent_lca_child + 1 到 end_ent_lca_child - 1 之间的所有实体
    processor(lca, start_path[lca_index] + 1, end_path[lca_index]);
  }
}

export async function split_ent(
  ecs: MixEditor["ecs"],
  ent_id: string,
  index: number
) {
  const ent = ecs.get_ent(ent_id);
  if (!ent) throw new Error(`无法获取实体 ${ent_id}。`);

  const split_outs = new Map<string, any>();
  const cloned_compos: Compo[] = [];

  const get_split_out_promises = Array.from(
    ecs.get_own_compos(ent_id).values()
  ).map(async (compo) => {
    const result = await ecs.run_compo_behavior(compo, TreeSplitOutCb, {
      index,
    });
    if (result) {
      split_outs.set(compo.type, result);
    } else {
      const cloned_compo = await clone_compo(ecs, compo);
      if (cloned_compo) {
        cloned_compos.push(cloned_compo);
      } else {
        // TODO: 需要决定无法分割和克隆的组件如何处理
      }
    }
  });

  await Promise.all(get_split_out_promises);

  const new_ent = await ecs.create_ent(ent.type);
  const apply_split_out_promises = Array.from(split_outs.entries()).map(
    async ([compo_type, split_out_result]) => {
      const new_ent_compo = await ecs.get_or_create_compo(
        new_ent.id,
        compo_type
      );

      await ecs.run_compo_behavior(new_ent_compo, TreeSplitInCb, {
        data: split_out_result,
      });
    }
  );

  await Promise.all(apply_split_out_promises);

  // 将克隆的组件添加到新实体
  ecs.set_compos(new_ent.id, cloned_compos);

  return { new_ent_id: new_ent.id, split_outs };
}

/** 根据路径分割 `ent_id` 实体。*/
export async function split_ent_by_path(
  ecs: MixEditor["ecs"],
  ent_id: string,
  /** 分割路径，前面是实体索引，最后一位是位置索引。
   *
   * 长度至少为1，因为至少需要指定一个位置索引。
   *
   * 例如，[4, 2] 表示以 `ent_id` 的第4个子实体的第2个位置作为分割点。
   */
  path: number[]
) {
  if (path.length < 1) throw new Error("分割路径至少需要包含一个位置索引。");

  /** 根实体到最后一个待分割实体的实体 ID 列表，长度为 path.length - 1 */
  const ent_list: string[] = [ent_id];
  const split_outs: Map<string, any>[] = [];
  let splited_root_ent_id!: string;

  // 获取从根实体到最后一个待分割实体的实体 ID 列表
  // 循环到倒数第二个，也就是最后一个实体索引
  for (let i = 0; i < path.length - 2; i++) {
    const child_index = path[i];
    const child_ent = get_child_ent_id(ecs, ent_list[i], child_index);
    if (!child_ent)
      throw new Error(
        `无法获取实体 ${ent_list[i]} 的第 ${child_index} 个子实体。`
      );
    ent_list.push(child_ent);
  }

  let pos_index = path[path.length - 1];

  // 从内到外分割
  for (let i = path.length - 1; i >= 0; i--) {
    /** 待分割的位置索引 */
    const ent_to_split = ent_list[i];
    const ent = ecs.get_ent(ent_to_split);
    if (!ent) throw new Error(`无法获取实体 ${ent_to_split}。`);
    const { new_ent_id, split_outs: new_split_outs } = await split_ent(
      ecs,
      ent_to_split,
      pos_index
    );

    // 将分割结果放到自己父元素
    if (i === 0) {
      splited_root_ent_id = new_ent_id;
    } else {
      const self_pos_index_in_parent = path[i];
      const parent_ent = ent_list[i - 1];
      const parent_actual_child_compo = get_actual_child_compo(ecs, parent_ent);
      if (!parent_actual_child_compo)
        throw new Error(`无法获取实体 ${parent_ent} 的实际子实体组件。`);

      // 将新实体插入到自己后面
      ecs.run_compo_behavior(parent_actual_child_compo, TreeInsertChildrenCb, {
        items: [new_ent_id],
        index: self_pos_index_in_parent + 1,
      });

      // 下一次分割应该在新旧实体之间
      pos_index = self_pos_index_in_parent + 1;
    }

    split_outs.push(new_split_outs);
  }

  return {
    new_ent_id: splited_root_ent_id,
    /** 分割结果，是按从内到外的顺序排列的。*/
    split_outs,
  };
}

export enum WalkDecision {
  /** 继续向下遍历。 */
  Continue = "continue",
  /** 停止遍历。 */
  StopWalk = "stop_walk",
  /** 停止遍历，并返回当前实体。 */
  StopDrive = "stop_drive",
}

export const WalkDone = Symbol("walk_done");

export function walk(
  ecs: MixEditor["ecs"],
  ent_id: string,
  processor: (ent_id: string) => WalkDecision | void
) {
  // 使用数组作为栈
  const stack: string[] = [ent_id];

  // 当栈不为空时继续遍历
  while (stack.length > 0) {
    // 弹出栈顶元素
    const current_ent = stack.pop()!;

    // 处理当前实体
    const decision = processor(current_ent);

    // 如果决定停止遍历，则跳过该节点的子节点
    if (decision === WalkDecision.StopDrive) continue;
    else if (decision === WalkDecision.StopWalk) {
      return current_ent;
    }

    const actual_child_compo = get_actual_child_compo(ecs, current_ent);
    if (!actual_child_compo || actual_child_compo.is_leaf()) continue;

    // 获取子实体数量
    const child_count = actual_child_compo.count();

    // 逆序遍历子实体（这样出栈时顺序会是正序）
    for (let i = child_count - 1; i >= 0; i--) {
      const child_id = get_child_ent_id(ecs, current_ent, i);
      if (child_id) {
        // 将子实体压入栈中
        stack.push(child_id);
      }
    }
  }

  return WalkDone;
}

export function reverse_walk(
  ecs: MixEditor["ecs"],
  ent_id: string,
  processor: (ent_id: string) => WalkDecision | void
) {
  // 使用数组作为栈
  const stack: string[] = [ent_id];

  // 当栈不为空时继续遍历
  while (stack.length > 0) {
    // 弹出栈顶元素
    const current_ent = stack.pop()!;

    // 处理当前实体
    const decision = processor(current_ent);

    // 如果决定停止遍历，则跳过该节点的子节点
    if (decision === WalkDecision.StopDrive) continue;
    else if (decision === WalkDecision.StopWalk) {
      return current_ent;
    }

    const actual_child_compo = get_actual_child_compo(ecs, current_ent);
    if (!actual_child_compo || actual_child_compo.is_leaf()) continue;

    // 获取子实体数量
    const child_count = actual_child_compo.count();

    // 正序遍历子实体（这样最后一个子实体会最先被处理）
    for (let i = 0; i < child_count; i++) {
      const child_id = get_child_ent_id(ecs, current_ent, i);
      if (child_id) {
        // 将子实体压入栈中
        stack.push(child_id);
      }
    }
  }

  return WalkDone;
}
