import {
  create_TreeCollapsedSelection,
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  get_lca_of_ent,
  get_parent_ent_id,
  MixEditor,
  print_tree,
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
  /** 是否宽松合并。宽松合并会对 `src_id` 的实体进行宽松合并，即使 `src_id` 不携带一些组件，或者组件状态不一致。 */
  loose?: boolean;
}

export class MergeDecisionRejectedError extends Error {
  constructor() {
    super("merge rejected");
    this.name = "MergeDecisionRejectedError";
  }
}

export async function get_merge_decision(
  editor: MixEditor,
  host: string,
  source: string,
  /** 是否宽松合并。宽松合并会对 `src_id` 的实体进行宽松合并，即使 `src_id` 不携带一些组件，或者组件状态不一致。 */
  loose?: boolean
) {
  // 采用组件投票制，任一组件拒绝则终止合并

  const { ecs } = editor;
  const host_compos = ecs.get_compos(host);
  const source_compos = ecs.get_compos(source);
  const all_compos = new Set([
    ...host_compos.values(),
    ...source_compos.values(),
  ]);

  // 先检查host实体的所有组件的合并决策
  try {
    await Promise.all(
      Array.from(all_compos).map(async (compo) => {
        // 执行合并决策函数
        const decision = await ecs.run_compo_behavior(compo, DocMergeCb, {
          ent_id: host,
          src_id: source,
          loose,
        });

        // 如果有组件拒绝合并，整个合并就失败
        if (decision && decision.type === "reject") {
          throw new MergeDecisionRejectedError();
        }
      })
    );
  } catch (e) {
    if (e instanceof MergeDecisionRejectedError) {
      return MergeDecision.Reject;
    }

    throw e;
  }

  return MergeDecision.Allow;
}

/** 执行单层实体合并。*/
export async function execute_merge_single_layer_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  /** 要合并到的宿主实体的偏移 */
  host_offset: number,
  source: string
) {
  const { ecs, op } = editor;

  // 默认允许合并
  const decision = await get_merge_decision(editor, host, source);
  console.log(
    "单层合并",
    "host",
    host,
    await print_tree(editor, host),
    "host_offset",
    host_offset,
    "source",
    source,
    await print_tree(editor, source),
    "decision",
    decision
  );

  // 如果最终决策是允许合并
  if (decision.type === "allow") {
    // 移动 source 实体的所有子实体到 host 实体末尾
    const src_child_count = get_child_ent_count(ecs, source);
    await tx.execute(
      new TreeMoveChildrenOp(
        op.gen_id(),
        source,
        0,
        src_child_count,
        host,
        host_offset
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
      offset: host_offset + src_child_count,
    };
  }
}

/** 执行深度前向合并流程。
 *
 * 深度前向合并会尝试将 `source` 的所有内容合并到 `host` 的末尾，如果成功了，则会继续以 `host` 之前的尾节点为新的 `host`，`source` 之前的头节点为新的 `source`，继续尝试合并。
 * 直到 `host` 和 `source` 不存在或合并失败。
 */
export async function execute_deep_forward_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host?: string,
  source?: string
) {
  const { ecs } = editor;

  let caret: TreeCaret | undefined;

  let curr_host: string | undefined = host;
  let curr_source: string | undefined = source;

  while (curr_host && curr_source) {
    const host_child_count = get_child_ent_count(ecs, curr_host);
    // 尝试合并当前层级的host末尾和source起始
    const merge_result = await execute_merge_single_layer_ent(
      editor,
      tx,
      curr_host,
      host_child_count,
      curr_source
    );
    if (!merge_result) break;

    caret = merge_result;
    const prev_host = curr_host;

    curr_host = get_child_ent_id(ecs, prev_host, host_child_count - 1);
    curr_source = get_child_ent_id(ecs, prev_host, host_child_count);
  }

  return caret;
}

/** 执行实体合并流程。
 *
 * 实体合并流程会尝试将 `source` 的所有内容合并到 `host` 的指定位置 `host_offset`。
 * 然后对合并后的实体进行深度前向合并。
 *
 * ## 示例
 * 假设源文档是
 * ```
 * Root [
 *   Paragraph [
 *     Text(Bold) [A]
 *     Text [B]
 *   ]
 *   Paragraph [
 *     Text [C]
 *     Text(Bold) [D]
 *   ]
 * ]
 * ```
 *
 * 如果执行 `execute_merge_ent(editor, tx, idof(Root[0]), 0, idof(Root[1]))`，
 * 则结果是：
 * ```
 * Root [
 *   Paragraph [
 *     Text(Bold) [A]
 *     Text [BC]
 *     Text(Bold) [D]
 *   ]
 * ]
 * ```
 */
export async function execute_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  host_offset: number,
  source: string
) {
  let caret: TreeCaret | undefined;

  const { ecs } = editor;

  // 执行单层合并
  const result = await execute_merge_single_layer_ent(
    editor,
    tx,
    host,
    host_offset,
    source
  );

  if (!result) return { caret: undefined };
  caret = result;

  // 进行前向合并
  const deep_forward_result = await execute_deep_forward_merge_ent(
    editor,
    tx,
    get_child_ent_id(ecs, host, host_offset),
    get_child_ent_id(ecs, host, host_offset + 1)
  );
  if (deep_forward_result) {
    caret = deep_forward_result;
  }

  return { caret };
}

/** 执行跨父实体合并流程。适合用于合并两个父实体不一致的实体。
 *
 * 跨父实体合并流程会从最近公共祖先开始尝试合并，在确保host和source的祖先层级一致后，会继续尝试合并host的尾节点和source的头节点，直到合并成功或遍历完所有层级。
 *
 * ## 示例
 * 假设源文档是
 * ```
 * Root [
 *   Paragraph [
 *     Text(Bold) [A]
 *     Text [B]
 *   ]
 *   Paragraph [
 *     Text [C]
 *     Text(Bold) [D]
 *   ]
 * ]
 * ```
 *
 * 如果执行 `execute_cross_parent_merge_ent(editor, tx, idof(Root[0][1]), 0, idof(Root[1][0]))`，
 * 则结果是：
 * ```
 * Root [
 *   Paragraph [
 *     Text(Bold) [A]
 *     Text [BC]
 *     Text(Bold) [D]
 *   ]
 * ]
 */
export async function execute_cross_parent_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host: string,
  /** 要合并到的宿主实体的偏移 */
  host_offset: number,
  source: string
) {
  let caret: TreeCaret | undefined;

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
    const host_ancestor_child_count = get_child_ent_count(ecs, host_ancestor);

    const result = await execute_merge_single_layer_ent(
      editor,
      tx,
      host_ancestor,
      i === min_ancestor_length - 1 ? host_ancestor_child_count : host_offset,
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
    const deep_forward_result = await execute_deep_forward_merge_ent(
      editor,
      tx,
      last_child_of_host,
      first_child_of_source
    );
    if (deep_forward_result) {
      caret = deep_forward_result;
    }
  }

  return {
    selection: caret ? create_TreeCollapsedSelection(caret) : undefined,
  };
}
