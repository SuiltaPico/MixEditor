import { MixEditor } from "../mixeditor";
import { Node } from "../node/node";
import { get_common_ancestor_from_node } from "../node/path";
import { Operation } from "../operation/Operation";
import { create_DeleteRangeOperation } from "../operation/operations/delete_range";

/** 节点对合并的决策 */
export const MergeNodeDecision = {
  /** 不合并 */
  Reject: {
    type: "reject",
  },
  /** 已经处理完合并 */
  Done: (props: { operations: Operation[] }) => {
    const result = props as {
      type: "done";
      operations: Operation[];
    };
    result.type = "done";
    return result;
  },
} as const;

export type MergeNodeDecisionReject = (typeof MergeNodeDecision)["Reject"];
export type MergeNodeDecisionDone = ReturnType<
  (typeof MergeNodeDecision)["Done"]
>;
export type MergeNodeDecision = MergeNodeDecisionReject | MergeNodeDecisionDone;

/** 执行简单节点合并。 */
export async function execute_simple_merge_node(
  editor: MixEditor,
  host: Node,
  source: Node
) {
  const operations: Operation[] = [];
  const { node_manager, operation_manager } = editor;

  const decision = await node_manager.execute_handler(
    "handle_merge_node",
    host,
    source as any
  );
  console.log("execute_simple_merge_node", host, source, decision);

  if (decision?.type === "done") {
    operations.push(...decision.operations);

    // 删除 source 节点
    const source_parent = node_manager.get_parent(source);
    if (source_parent) {
      const source_index = await node_manager.execute_handler(
        "get_index_of_child",
        source_parent,
        source as any
      )!;
      operations.push(
        operation_manager.create_operation(
          create_DeleteRangeOperation,
          source_parent.id,
          source_index,
          source_index
        )
      );
    }
  }

  return operations;
}

/** 执行复杂节点合并 */
export async function execute_merge_node(
  editor: MixEditor,
  host: Node,
  source: Node
) {
  const operations: Operation[] = [];
  const { node_manager, operation_manager } = editor;

  // 获取公共祖先，从公共祖先的子节点开始，尝试逐层合并，直到有一层不接受合并为止。
  const common_ancestor_info = await get_common_ancestor_from_node(
    node_manager,
    host,
    source
  );
  if (!common_ancestor_info) return operations;

  const { ancestors1, ancestors2, ancestor_index } = common_ancestor_info;
  console.log("execute_merge_node", host, source, common_ancestor_info);

  const full_ancestors_chain1 = ancestors1.concat(host);
  const full_ancestors_chain2 = ancestors2.concat(source);

  // 从公共祖先开始，尝试逐层合并
  for (let i = ancestor_index + 1; i < full_ancestors_chain1.length; i++) {
    const host = full_ancestors_chain1[i];
    const source = full_ancestors_chain2[i];

    const decision = await node_manager.execute_handler(
      "handle_merge_node",
      host,
      source as any
    );
    console.log("execute_merge_node", host, source, decision);

    const this_step_operations: Operation[] = [];

    if (decision?.type === "done") {
      this_step_operations.push(...decision.operations);

      // 删除 source 节点
      const source_parent = node_manager.get_parent(source);
      if (source_parent) {
        const source_index = await node_manager.execute_handler(
          "get_index_of_child",
          source_parent,
          source as any
        )!;
        this_step_operations.push(
          operation_manager.create_operation(
            create_DeleteRangeOperation,
            source_parent.id,
            source_index,
            source_index
          )
        );
      }

      // 让最内部的节点的 operation 先执行，外部的节点后执行
      operations.unshift(...this_step_operations);
    } else {
      operations.unshift(...this_step_operations);
      break;
    }
  }
  return operations;
}
