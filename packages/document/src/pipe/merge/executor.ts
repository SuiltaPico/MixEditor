import {
  create_TreeCollapsedSelection,
  get_child_ent_count,
  get_index_in_parent_ent,
  get_index_of_child_ent,
  get_lca_of_ent,
  get_parent_ent_id,
  MESelection,
  MixEditor,
  Transaction,
  TreeChildrenDeleteOp,
  TreeChildrenMoveOp,
} from "@mixeditor/core";
import { DocMergeCb } from "./compo_behavior";

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

export async function execute_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  source: string
) {
  let selection: MESelection | undefined;

  // host 和 source 合并、host 尾节点 和 source 头节点合并……直到有一个被遍历完
  // 合并使用众议制度。
  // 一开始是允许合并的，先提取两个 Entity 的所有 Component，再提取所有 Component 的合并决策函数，逐一运行，如果有 Component 做出了否定决策，则不能合并

  // 如果host和source是同一个实体，无需合并
  if (host === source) return { selection };

  const { ecs, op } = editor;
  console.log("[merge_ent]", ecs.get_ent(host), ecs.get_ent(source));

  const lca_result = get_lca_of_ent(ecs, host, source);
  if (!lca_result) return { selection };

  const {
    ancestors1: host_ancestors,
    ancestors2: source_ancestors,
    lca_index,
  } = lca_result;
  const min_ancestor_length = Math.min(
    host_ancestors.length,
    source_ancestors.length
  );

  for (let i = lca_index + 1; i < min_ancestor_length; i++) {
    const host_ancestor = host_ancestors[i];
    const source_ancestor = source_ancestors[i];

    // 获取两个实体的所有组件
    const host_compos = ecs.get_compos(host_ancestor);
    const source_compos = ecs.get_compos(source_ancestor);
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
        ent_id: host_ancestor,
        src_id: source_ancestor,
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
      const host_ancestor_child_count = get_child_ent_count(ecs, host_ancestor);
      const src_ancestor_child_count = get_child_ent_count(
        ecs,
        source_ancestor
      );
      await tx.execute(
        new TreeChildrenMoveOp(
          op.gen_id(),
          source_ancestor,
          0,
          src_ancestor_child_count,
          host_ancestor,
          host_ancestor_child_count
        )
      );

      // 删除 source 实体
      const source_ancestor_parent = get_parent_ent_id(ecs, source_ancestor);
      if (!source_ancestor_parent) continue;

      const source_ancestor_index_in_parent = get_index_of_child_ent(
        ecs,
        source_ancestor_parent,
        source_ancestor
      );
      await tx.execute(
        new TreeChildrenDeleteOp(
          op.gen_id(),
          source_ancestor_parent,
          source_ancestor_index_in_parent,
          source_ancestor_index_in_parent + 1
        )
      );

      selection = create_TreeCollapsedSelection({
        ent_id: host_ancestor,
        offset: host_ancestor_child_count,
      });
    } else {
      break;
    }
  }

  return { selection };
}
