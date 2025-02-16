import { MixEditor } from "../MixEditor";
import { Node } from "../node/Node";
import { get_common_ancestor_from_node } from "../node/path";
import { Operation } from "../operation/Operation";
import { create_BatchOperation } from "../operation/operations";
import { Selected, SelectedData } from "../selection";

/** 节点对删除范围的决策。 */
export const DeleteRangeDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。 */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { operation?: Operation; selected?: Selected }) => {
    const result = props as {
      type: "done";
      operation?: Operation;
      selected?: Selected;
    };
    result.type = "done";
    return result;
  },
} as const;

export type DeleteRangeDecisionDeleteSelf =
  (typeof DeleteRangeDecision)["DeleteSelf"];
export type DeleteRangeDecisionDone = ReturnType<
  (typeof DeleteRangeDecision)["Done"]
>;
export type DeleteRangeDecision =
  | DeleteRangeDecisionDeleteSelf
  | DeleteRangeDecisionDone;

export async function execute_delete_range(
  editor: MixEditor,
  start: SelectedData,
  end: SelectedData
) {
  const node_manager = editor.node_manager;
  const operations: any[] = [];

  // 查找最近公共祖先
  const common_ancestor_result = await get_common_ancestor_from_node(
    node_manager,
    start.node,
    end.node
  );
  if (!common_ancestor_result) return;
  const common_ancestor = common_ancestor_result.common_ancestor;

  // 处理起始节点到公共祖先的路径
  let current: Node | undefined = start.node;
  let temp_start_child_path = start.child_path;
  while (current && current !== common_ancestor) {
    const result = await node_manager.execute_handler(
      "delete_range",
      current,
      temp_start_child_path,
      Number.MAX_SAFE_INTEGER
    );

    const decision_type = result?.type ?? "delete_self";
    if (decision_type === "done") {
      if (result.operation) {
        operations.push(result.operation);
      }
      return;
    }

    // 获取父节点
    const parent = node_manager.get_parent(current);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      current as any
    );

    current = parent;
    temp_start_child_path = index_in_parent!;
    // 如果当前节点是删除自身，则将删除范围把自己也算进去
    if (decision_type === "delete_self") {
      temp_start_child_path = index_in_parent! - 1;
    }
  }

  // 处理结束节点到公共祖先的路径
  current = end.node;
  let temp_end_child_path = end.child_path;
  while (current && current !== common_ancestor) {
    const result = await node_manager.execute_handler(
      "delete_range",
      current,
      0,
      temp_end_child_path
    );

    const decision_type = result?.type ?? "delete_self";
    if (decision_type === "done") {
      if (result.operation) {
        operations.push(result.operation);
      }
      return;
    }

    // 获取父节点
    const parent = node_manager.get_parent(current);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      current as any
    );

    current = parent;
    temp_end_child_path = index_in_parent!;
    // 如果当前节点是删除自身，则将删除范围把自己也算进去
    if (decision_type === "delete_self") {
      temp_end_child_path = index_in_parent! + 1;
    }
  }

  // --- 处理公共祖先到结束节点的路径 ---
  // 起始节点在共同祖先的子节点索引
  const start_ancestor_index = await node_manager.execute_handler(
    "get_index_of_child",
    common_ancestor,
    start.node as any
  )!;

  // 结束节点在共同祖先的子节点索引
  const end_ancestor_index = await node_manager.execute_handler(
    "get_index_of_child",
    common_ancestor,
    end.node as any
  )!;

  current = common_ancestor;
  temp_start_child_path = start_ancestor_index + 1;
  temp_end_child_path = end_ancestor_index - 1;
  while (current) {
    const result = await node_manager.execute_handler(
      "delete_range",
      current,
      temp_start_child_path,
      temp_end_child_path
    );

    const decision_type = result?.type ?? "delete_self";
    if (decision_type === "done") {
      if (result.operation) operations.push(result.operation);
      return;
    }

    // --- 否则则继续执行 delete_range 责任链 ---
    // 获取父节点
    const parent = node_manager.get_parent(current);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      current as any
    );

    current = parent;
    temp_start_child_path = index_in_parent!;
    temp_end_child_path = index_in_parent! - 1;
  }

  return create_BatchOperation(
    editor.operation_manager.generate_id(),
    operations
  );
}
