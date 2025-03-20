import { MixEditor, Transaction } from "@mixeditor/core";
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
  // host 和 source 合并、host 尾节点 和 source 头节点合并……直到有一个被遍历完
  // 合并使用众议制度。
  // 一开始是允许合并的，先提取两个 Entity 的所有 Component，再提取所有 Component 的合并决策函数，逐一运行，如果有 Component 做出了否定决策，则不能合并

  // 如果host和source是同一个实体，无需合并
  if (host === source) return;

  const ecs = editor.ecs;

  // 创建合并上下文
  const merge_context: MergeContext = {
    ent_id: host,
    src_id: source,
  };

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
    const decision = await ecs.run_compo_behavior(
      compo,
      DocMergeCb,
      merge_context
    );

    // 如果有组件拒绝合并，整个合并就失败
    if (decision && decision.type === "reject") {
      final_decision = MergeDecision.Reject;
      break;
    }
  }

  // 如果最终决策是允许合并
  if (final_decision.type === "allow") {
    // TODO: 合并
  }

  // 返回最终决策结果
  return final_decision;
}
