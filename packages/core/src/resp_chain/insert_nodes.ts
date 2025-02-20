import { Node } from "../entity/node/node";
import { MixEditor } from "../mixeditor";
import { Operation } from "../operation/operation";

/** 插入来源。 */
export type InsertNodeFrom = {
  type: "child";
  /** 插入来源的子节点 */
  child: Node;
  /** 插入来源的子节点索引 */
  child_index: number;
  /** 插入来源的子节点分割索引 */
  child_split_index: number;
};

/** 节点对插入节点的决策。 */
export const InsertNodesDecision = {
  /** 不接受。
   * @default
   */
  Reject: {
    type: "reject",
  },
  /** 接受。 */
  Accept: (props: Omit<InsertNodesDecisionAccept, "type">) => {
    const result = props as InsertNodesDecisionAccept;
    result.type = "accept";
    return result;
  },
} as const;

export type InsertNodesDecisionReject = (typeof InsertNodesDecision)["Reject"];
export type InsertNodesDecisionAccept = {
  type: "accept";
  /** 插入的操作。 */
  operations: Operation[];
  /** 不接受的节点。 */
  rejected_nodes: Node[];
  /** 如果父节点要分割自己时，应该分割的索引。 */
  split_index: number;
};
/** 节点对插入节点的决策。 */
export type InsertNodesDecision =
  | InsertNodesDecisionReject
  | InsertNodesDecisionAccept;

export interface InsertNodesStrategyContext {
  /** 要插入的索引。 */
  insert_index: number;
  /** 要插入的节点。 */
  nodes_to_insert: Node[];
  /** 插入的来源。 */
  from?: InsertNodeFrom;
}

export interface InsertNodesStrategyConfig {
  context: InsertNodesStrategyContext;
  decision: InsertNodesDecision;
}

/** 执行节点插入。 */
export async function execute_insert_nodes(
  editor: MixEditor,
  node: Node,
  insert_index: number,
  nodes_to_insert: Node[],
  from?: InsertNodeFrom
) {
  const node_manager = editor.node_manager;
  const operations: Operation[] = [];

  let current: Node | undefined = node;
  let current_index = insert_index;
  let remaining_nodes = nodes_to_insert;
  let current_from = from;

  // 从起始节点开始向上遍历
  while (current) {
    // 处理当前节点的插入决策
    const result = await node_manager.get_decision(
      "insert_nodes",
      current as any,
      {
        insert_index: current_index,
        nodes_to_insert: remaining_nodes,
        from: current_from,
      }
    );

    if (result?.type === "accept") {
      // 如果有操作需要执行，添加到操作列表
      if (result.operations) {
        operations.push(...result.operations);
      }

      // 更新剩余需要插入的节点
      remaining_nodes = result.rejected_nodes;

      // 如果没有剩余节点需要处理，结束循环
      if (remaining_nodes.length === 0) break;

      // 获取父节点继续处理
      const parent = node_manager.get_parent(current);
      if (!parent) break;

      // 获取当前节点在父节点中的索引
      const index_in_parent = await node_manager.execute_handler(
        "get_index_of_child",
        parent,
        current as any
      );

      current_from = {
        type: "child",
        child: current,
        child_index: index_in_parent!,
        child_split_index: result.split_index,
      };

      // 更新当前节点和插入索引
      current = parent;
      current_index = index_in_parent! + 1;

      // 如果需要分割当前节点
      if (result.split_index !== undefined) {
        // 在父节点的 index_in_parent + 1 位置插入剩余节点
        current_index = index_in_parent! + 1;
      }
    } else {
      // 如果节点没有处理结果，直接向上传递
      const parent = node_manager.get_parent(current);
      if (!parent) break;

      const index_in_parent = await node_manager.execute_handler(
        "get_index_of_child",
        parent,
        current as any
      );

      current = parent;
      current_index = index_in_parent! + 1;
    }
  }

  // 返回批量操作
  return operations;
}
