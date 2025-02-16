import { MixEditor } from "../MixEditor";
import { Node } from "../node/Node";
import { Operation } from "../operation/Operation";
import { create_DeleteRangeOperation } from "../operation/operations/DeleteRange";

/** 节点对合并的决策 */
export const MergeNodeDecision = {
  /** 跳过合并,交给父节点处理 */
  Skip: {
    type: "skip",
  },
  /** 已经处理完合并 */
  Done: {
    type: "done",
  },
} as const;

export type MergeNodeDecisionSkip = (typeof MergeNodeDecision)["Skip"];
export type MergeNodeDecisionDone = (typeof MergeNodeDecision)["Done"];
export type MergeNodeDecision = MergeNodeDecisionSkip | MergeNodeDecisionDone;

export async function execute_merge_node(
  editor: MixEditor,
  node: Node,
  target: Node
): Promise<Operation | undefined> {
  const node_manager = editor.node_manager;

  // 执行当前节点的合并处理
  const result = await node_manager.execute_handler(
    "handle_merge_node",
    node,
    target as any
  );

  if (result?.type === "done") {
    // 如果返回 Done,删除目标节点并结束责任链
    return editor.operation_manager.create_operation(
      create_DeleteRangeOperation,
      target.id,
      0,
      // target.text.length
    );
  } else if (result?.type === "skip") {
    // 如果返回 Skip,交给父节点处理
    const parent = node_manager.get_parent(node);
    if (!parent) return; // 到达根节点,结束责任链

    // 递归处理父节点的合并
    return await execute_merge_node(editor, parent, target);
  }
}
