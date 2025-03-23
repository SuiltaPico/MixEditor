import {
  create_TreeCollapsedSelection,
  get_child_ent_count,
  get_child_ent_id,
  get_index_in_parent_ent,
  get_index_of_child_ent,
  get_lca_of_ent,
  get_parent_ent_id,
  MESelection,
  MixEditor,
  Transaction,
  TreeCaret,
  TreeDeleteChildrenOp,
  TreeMoveChildrenOp,
} from "@mixeditor/core";
import { DocMergeCb } from "./cb";

/** 合并决策。 */
export const MergeDecision = {
  /** 允许合并。 */
  Allow: { type: "allow" },
  /** 拒绝合并。 */
  Reject: { type: "reject" },
} as const;

export type MergeDecision = { type: "allow" } | { type: "reject" };

export interface MergeContext {
  /** 当前导航实体 */
  ent_id: string;
  /** 要合并的目标节点。 */
  src_id: string;
}

/**
 * 执行单层实体合并
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param host 宿主实体ID
 * @param source 源实体ID
 * @returns 合并后的选择状态
 */
export async function execute_merge_single_layer_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  source: string
) {
  const { ecs, op } = editor;
  // 获取两个实体的所有组件
  const host_compos = ecs.get_compos(host);
  const source_compos = ecs.get_compos(source);
  const all_compos = new Set([
    ...host_compos.values(),
    ...source_compos.values(),
  ]);

  // 默认允许合并
  let final_decision: MergeDecision = MergeDecision.Allow;

  // 先检查host实体的所有组件的合并决策
  for (const compo of all_compos) {
    // 执行合并决策函数
    const decision = await ecs.run_compo_behavior(compo, DocMergeCb, {
      ent_id: host,
      src_id: source,
    });

    // 如果有组件拒绝合并，整个合并就失败
    if (decision && decision.type === "reject") {
      final_decision = MergeDecision.Reject;
      break;
    }
  }

  // 如果最终决策是允许合并
  if (final_decision.type === "allow") {
    // 移动 source 实体的所有子实体到 host 实体末尾
    const host_child_count = get_child_ent_count(ecs, host);
    const src_child_count = get_child_ent_count(ecs, source);
    await tx.execute(
      new TreeMoveChildrenOp(
        op.gen_id(),
        source,
        0,
        src_child_count,
        host,
        host_child_count
      )
    );

    // 删除 source 实体
    const source_parent = get_parent_ent_id(ecs, source);
    if (!source_parent) return;

    const source_index_in_parent = get_index_of_child_ent(
      ecs,
      source_parent,
      source
    );
    await tx.execute(
      new TreeDeleteChildrenOp(
        op.gen_id(),
        source_parent,
        source_index_in_parent,
        source_index_in_parent + 1
      )
    );

    // 返回合并后的光标（聚焦到宿主末尾）
    return {
      ent_id: host,
      offset: host_child_count,
    };
  }
}

/** 执行完整实体合并流程。
 */
export async function execute_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  source: string
) {
  let caret: TreeCaret | undefined;

  // host 和 source 合并、host 尾节点 和 source 头节点合并……直到有一个被遍历完
  // 合并使用众议制度。
  // 一开始是允许合并的，先提取两个 Entity 的所有 Component，再提取所有 Component 的合并决策函数，逐一运行，如果有 Component 做出了否定决策，则不能合并

  // 如果host和source是同一个实体，无需合并
  if (host === source) return { selection: undefined };

  const { ecs } = editor;

  // 查找最近公共祖先(LCA)
  const lca_result = get_lca_of_ent(ecs, host, source);
  if (!lca_result) return { selection: undefined };

  const {
    ancestors1: host_ancestors,
    ancestors2: source_ancestors,
    lca_index,
  } = lca_result;
  const min_ancestor_length = Math.min(
    host_ancestors.length,
    source_ancestors.length
  );

  let merge_success = false;
  let full_outside_merge_success = false;

  const last_child_of_host = get_child_ent_id(
    ecs,
    host,
    get_child_ent_count(ecs, host) - 1
  );
  const first_child_of_source = get_child_ent_id(ecs, source, 0);

  // 从LCA下一层开始逐层合并
  for (let i = lca_index + 1; i < min_ancestor_length; i++) {
    const host_ancestor = host_ancestors[i];
    const source_ancestor = source_ancestors[i];

    const result = await execute_merge_single_layer_ent(
      editor,
      tx,
      host_ancestor,
      source_ancestor
    );

    if (!result) break;

    // 完成过一次合并就算合并成功
    merge_success = true;
    caret = result;

    if (i === min_ancestor_length - 1) {
      full_outside_merge_success = true;
    }
  }

  if (!merge_success) return;

  // 处理完全外部合并成功后的内部合并
  if (
    full_outside_merge_success ||
    last_child_of_host ||
    first_child_of_source
  ) {
    // 进行内部合并
    let current_host = last_child_of_host;
    let current_source = first_child_of_source;

    // 持续尝试合并相邻层级
    while (current_host && current_source) {
      // 合并成功则继续深入下一层
      const new_host_last_child = get_child_ent_id(
        ecs,
        current_host,
        get_child_ent_count(ecs, current_host) - 1
      );
      const new_source_first_child = get_child_ent_id(ecs, current_source, 0);

      // 尝试合并当前层级的host末尾和source起始
      const merge_result = await execute_merge_single_layer_ent(
        editor,
        tx,
        current_host,
        current_source
      );

      if (!merge_result) break;

      // 更新当前操作的host和source为子节点
      current_host = new_host_last_child;
      current_source = new_source_first_child;

      // 记录合并后的选择状态
      caret = merge_result;
    }
  }

  return {
    selection: caret ? create_TreeCollapsedSelection(caret) : undefined,
  };
}
