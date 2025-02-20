import { NavigateDirection } from "../common/navigate";
import { MixEditor } from "../mixeditor";
import { Operation } from "../operation/operation";
import { Selected, SelectedData } from "../selection";
import { execute_delete_range } from "./delete_range";

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
    type: "enter_child" as const,
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

export type DeleteFromPointDecisionSkip =
  (typeof DeleteFromPointDecision)["Skip"];
export type DeleteFromPointDecisionEnterChild = ReturnType<
  (typeof DeleteFromPointDecision)["EnterChild"]
>;
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

export interface DeleteFromPointStrategyContext {
  /** 要删除的方向。 */
  direction: NavigateDirection;
  /** 删除的起点。 */
  from: number;
}

export interface DeleteFromPointStrategyConfig {
  context: DeleteFromPointStrategyContext;
  decision: DeleteFromPointDecision;
}

export async function execute_delete_from_point(
  editor: MixEditor,
  selected_data: SelectedData,
  direction: NavigateDirection
): Promise<
  | {
      operation?: Operation;
      selected?: Selected;
    }
  | undefined
> {
  const node_manager = editor.node_manager;
  const to_prev = direction === NavigateDirection.Prev;

  // 执行当前节点的删除处理
  const result = await node_manager.get_decision(
    "delete_from_point",
    selected_data.node as any,
    {
      direction,
      from: selected_data.child_path,
    }
  );

  // 如果返回 Done，结束责任链
  if (!result || result.type === "delete_self") {
    // 获取父节点
    const parent = node_manager.get_parent(selected_data.node);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      selected_data.node as any
    );

    return {
      operation: await execute_delete_range(
        editor,
        {
          node: parent,
          child_path: index_in_parent! - 1,
        },
        {
          node: parent,
          child_path: index_in_parent!,
        }
      ),
    };
  } else if (result?.type === "done") {
    return { operation: result!.operation, selected: result!.selected };
  } else if (result?.type === "skip") {
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
  } else if (result?.type === "enter_child") {
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
  }
}
