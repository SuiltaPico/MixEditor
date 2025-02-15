import { NavigateDirection } from "../common/navigate";
import { MixEditor } from "../MixEditor";
import { Node } from "../node/Node";
import { get_common_ancestor_from_node } from "../node/path";
import { Operation } from "../operation/Operation";
import { create_BatchOperation } from "../operation/operations/Batch";
import { SelectedData } from "../selection";

/** 节点对删除点的决策。 */
export const DeleteFromPointDecision = {
  /** 跳过删除。删除将会交给自身的父节点处理。
   *
   * 例如，如果在 Text:0 上执行前向删除，Text 可以让删除移交给父节点进行处理。
   */
  Skip: {
    type: "skip",
  },
  /** 让删除移交给自身子节点处理。
   *
   * 例如，如果在 Paragraph:2 上执行前向删除，Paragraph 可以让删除移交给 Paragraph[2] 的子节点进行处理。
   */
  EnterChild: (child_path: number) => ({
    type: "enter_child",
    child_path,
  }),
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   *
   * 例如，如果 Image 被选中后删除，则 Image 可以让删除移交给父节点对自己进行删除。
   */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (operation?: Operation) => ({
    type: "done" as const,
    operation,
  }),
} as const;

/** 节点对删除范围的决策。 */
export const DeleteRangeDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。 */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (operations?: Operation[]) => ({
    type: "done" as const,
    operations,
  }),
} as const;

export type DeleteFromPointDecisionSkip =
  (typeof DeleteFromPointDecision)["Skip"];
export type DeleteFromPointDecisionEnterChild =
  (typeof DeleteFromPointDecision)["EnterChild"];
export type DeleteFromPointDecisionDeleteSelf =
  (typeof DeleteFromPointDecision)["DeleteSelf"];
export type DeleteFromPointDecisionDone = ReturnType<
  (typeof DeleteFromPointDecision)["Done"]
>;
export type DeleteFromPointDecision =
  | DeleteFromPointDecisionSkip
  | DeleteFromPointDecisionEnterChild
  | DeleteFromPointDecisionDeleteSelf
  | DeleteFromPointDecisionDone;

export type DeleteRangeDecisionDeleteSelf =
  (typeof DeleteRangeDecision)["DeleteSelf"];
export type DeleteRangeDecisionDone = ReturnType<
  (typeof DeleteRangeDecision)["Done"]
>;
export type DeleteRangeDecision =
  | DeleteRangeDecisionDeleteSelf
  | DeleteRangeDecisionDone;

export async function execute_delete_from_point(
  editor: MixEditor,
  selected_data: SelectedData,
  direction: NavigateDirection
) {
  const node_manager = editor.node_manager;
  const to_prev = direction === NavigateDirection.Prev;

  // 执行当前节点的删除处理
  const result = await node_manager.execute_handler(
    "delete_from_point",
    selected_data.node,
    selected_data.child_path,
    direction
  );

  const decision_type = result?.type ?? "delete_self";

  // 如果返回 Done，结束责任链
  if (decision_type === "done") {
    if (result.operation) return result.operation;
    return;
  } else if (decision_type === "skip") {
    // 处理 Skip 决策：将删除操作交给父节点处理
    const parent = node_manager.get_parent(selected_data.node);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      selected_data.node as any
    );

    // 递归处理父节点的删除
    return await execute_delete_from_point(
      editor,
      {
        node: parent,
        child_path: to_prev ? index_in_parent! - 1 : index_in_parent!,
      },
      direction
    );
  } else if (decision_type === "enter_child") {
    // 处理 EnterChild 决策：将删除操作交给指定子节点处理
    const child_node = await node_manager.execute_handler(
      "get_child",
      selected_data.node,
      result.child_path
    );

    if (!child_node) return; // 子节点不存在时终止

    // 递归处理子节点的删除
    return await execute_delete_from_point(
      editor,
      {
        node: child_node,
        child_path: to_prev ? Number.MAX_SAFE_INTEGER : 0,
      },
      direction
    );
  } else if (decision_type === "delete_self") {
    // 获取父节点
    const parent = node_manager.get_parent(selected_data.node);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      selected_data.node as any
    );

    return await execute_delete_range(
      editor,
      {
        node: parent,
        child_path: index_in_parent! - 1,
      },
      {
        node: parent,
        child_path: index_in_parent!,
      }
    );
  }
}

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
