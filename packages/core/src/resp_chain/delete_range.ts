import { MixEditor } from "../MixEditor";
import { Node } from "../node/Node";
import {
  get_common_ancestor_from_node,
  is_ancestor,
  is_parent,
} from "../node/path";
import { Operation } from "../operation/Operation";
import { create_BatchOperation } from "../operation/operations";
import { Selected, SelectedData } from "../selection";
import { execute_merge_node, execute_simple_merge_node } from "./merge_node";

/** 节点对删除范围的决策。 */
export const DeleteRangeDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   * @default
   */
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
  let current: Node | undefined;
  let temp_start_child_path: number | undefined;
  let temp_end_child_path: number | undefined;

  if (start.node === end.node) {
    current = start.node;
    while (current) {
      const result = await node_manager.execute_handler(
        "handle_delete_range",
        current,
        start.child_path,
        end.child_path
      );
      if (!result || result.type === "delete_self") {
        // --- 否则则继续执行 delete_range 责任链 ---
        // 获取父节点
        const parent = node_manager.get_parent(current);
        if (!parent) break; // 到达根节点，结束责任链

        // 获取当前节点在父节点中的索引
        const index_in_parent = await node_manager.execute_handler(
          "get_index_of_child",
          parent,
          current as any
        );

        current = parent;
        temp_start_child_path = index_in_parent!;
        temp_end_child_path = index_in_parent! - 1;
      } else if (result.type === "done") {
        const decision = result as DeleteRangeDecisionDone;
        if (decision?.operation) {
          operations.push(decision.operation);
        }
        break;
      }
    }
  } else {
    // 查找最近公共祖先
    const common_ancestor_data = await get_common_ancestor_from_node(
      node_manager,
      start.node,
      end.node
    );
    if (!common_ancestor_data) return;
    const common_ancestor = common_ancestor_data.common_ancestor;
    console.log("execute_delete_range", "common_ancestor", common_ancestor);

    // 处理起始节点到公共祖先的路径
    current = start.node;
    temp_start_child_path = start.child_path;
    while (current && current !== common_ancestor) {
      const result = await node_manager.execute_handler(
        "handle_delete_range",
        current,
        temp_start_child_path,
        Number.MAX_SAFE_INTEGER
      );

      const decision_type = result?.type ?? "delete_self";
      if (decision_type === "done") {
        const decision = result as DeleteRangeDecisionDone;
        if (decision?.operation) {
          operations.push(decision.operation);
        }
      }

      // 获取父节点
      const parent = node_manager.get_parent(current);
      if (!parent) break; // 到达根节点，结束责任链

      // 获取当前节点在父节点中的索引
      const index_in_parent = await node_manager.execute_handler(
        "get_index_of_child",
        parent,
        current as any
      );

      current = parent;
      temp_start_child_path = index_in_parent! + 1;
      // 如果当前节点是删除自身，则将删除范围把自己也算进去
      if (decision_type === "delete_self") {
        temp_start_child_path = index_in_parent!;
      }
    }

    // 处理结束节点到公共祖先的路径
    current = end.node;
    temp_end_child_path = end.child_path;
    while (current && current !== common_ancestor) {
      const result = await node_manager.execute_handler(
        "handle_delete_range",
        current,
        0,
        temp_end_child_path
      );

      const decision_type = result?.type ?? "delete_self";
      if (decision_type === "done") {
        const decision = result as DeleteRangeDecisionDone;
        if (decision?.operation) {
          operations.push(decision.operation);
        }
      }

      // 获取父节点
      const parent = node_manager.get_parent(current);
      if (!parent) break; // 到达根节点，结束责任链

      // 获取当前节点在父节点中的索引
      const index_in_parent = await node_manager.execute_handler(
        "get_index_of_child",
        parent,
        current as any
      );

      current = parent;
      temp_end_child_path = index_in_parent! - 1;
      // 如果当前节点是删除自身，则将删除范围把自己也算进去
      if (decision_type === "delete_self") {
        temp_end_child_path = index_in_parent!;
      }
    }

    // --- 处理公共祖先到结束节点的路径 ---
    console.log(
      common_ancestor_data.path1,
      common_ancestor_data.path2,
      common_ancestor_data.ancestor_index
    );

    current = common_ancestor;
    temp_start_child_path =
      common_ancestor_data.path1[common_ancestor_data.ancestor_index] + 1;
    temp_end_child_path =
      common_ancestor_data.path2[common_ancestor_data.ancestor_index] - 1;
    while (current) {
      const result = await node_manager.execute_handler(
        "handle_delete_range",
        current,
        temp_start_child_path,
        temp_end_child_path
      );

      const decision_type = result?.type ?? "delete_self";
      if (decision_type === "done") {
        const decision = result as DeleteRangeDecisionDone;
        if (decision?.operation) operations.push(decision.operation);
        break;
      }

      // --- 否则则继续执行 delete_range 责任链 ---
      // 获取父节点
      const parent = node_manager.get_parent(current);
      if (!parent) break; // 到达根节点，结束责任链

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
  }

  // 判断合并逻辑
  if (start.node !== end.node) {
    if (is_parent(node_manager, start.node, end.node)) {
      console.log(
        "execute_delete_range",
        "end.node 是 start.node 的父节点",
        start.node,
        end.node
      );
      // 如果 end.node 是 start.node 的父节点，
      // 尝试将 end.node[end.child_path + 1] 合并到 start.node 中
      const parent = end.node;
      const end_index = end.child_path;
      const next_node = await node_manager.execute_handler(
        "get_child",
        parent,
        end_index + 1
      );
      if (next_node) {
        const merge_ops = await execute_simple_merge_node(
          editor,
          start.node,
          next_node
        );
        operations.push(...merge_ops);
      }
    } else if (is_parent(node_manager, end.node, start.node)) {
      console.log(
        "execute_delete_range",
        "start.node 是 end.node 的父节点",
        start.node,
        end.node
      );
      // 如果 start.node 是 end.node 的父节点，
      // 尝试将 end.node 合并到 start.node[start.child_path - 1] 中
      const parent = start.node;
      const start_index = start.child_path;
      const prev_node = await node_manager.execute_handler(
        "get_child",
        parent,
        start_index - 1
      );
      if (prev_node) {
        const merge_ops = await execute_simple_merge_node(
          editor,
          prev_node,
          end.node
        );
        operations.push(...merge_ops);
      }
    } else {
      console.log(
        "execute_delete_range",
        "没有祖先关系，执行复杂合并",
        start.node,
        end.node
      );
      // 如果 start.node 和 end.node 没有祖先关系，就要查找公共祖先，
      // 然后从公共祖先的子节点开始，尝试逐层合并，直到有一层不接受合并为止。
      const merge_ops = await execute_merge_node(editor, start.node, end.node);
      operations.push(...merge_ops);
    }
  }

  return create_BatchOperation(
    editor.operation_manager.generate_id(),
    operations
  );
}
