import { NavigateDirection } from "../common/navigate";
import { MixEditor } from "../mixeditor";
import { SelectedData } from "../selection";

export enum CaretNavigateFrom {
  Parent = "parent",
  Child = "child",
}

export type CaretNavigateEnterDecisionEnterSelf = {
  type: "enter_self";
  to: number;
};
export type CaretNavigateEnterDecisionEnterChild = {
  type: "enter_child";
  to: number;
};
export type CaretNavigateEnterDecisionSkip = {
  type: "skip";
};

export const CaretNavigateEnterDecision = {
  /** 不接受进入，跳过当前节点。 */
  Skip: { type: "skip" } satisfies CaretNavigateEnterDecisionSkip,
  /** 接受进入，并把光标移动到指定位置。 */
  Enter: (to: number = 0) =>
    ({ type: "enter_self", to } satisfies CaretNavigateEnterDecisionEnterSelf),
  /** 接受进入，交给此节点内部的指定节点处理。 */
  EnterChild: (to: number = 0) =>
    ({
      type: "enter_child",
      to,
    } satisfies CaretNavigateEnterDecisionEnterChild),
};

export type CaretNavigateEnterDecision =
  | CaretNavigateEnterDecisionEnterSelf
  | CaretNavigateEnterDecisionEnterChild
  | CaretNavigateEnterDecisionSkip;

export async function execute_caret_navigate_from_selected_data(
  editor: MixEditor,
  selected_data: SelectedData,
  direction: NavigateDirection,
  from?: CaretNavigateFrom
): Promise<SelectedData | undefined> {
  const node_manager = editor.node_manager;

  const result = await node_manager.execute_handler(
    "handle_caret_navigate",
    selected_data.node,
    selected_data.child_path,
    direction,
    from
  );

  const decision_type = result?.type ?? "skip";

  if (decision_type === "skip") {
    // 跳过当前节点，往下一个节点移动
    const node = selected_data.node;
    const parent = node_manager.get_parent(node);

    if (!parent) return;

    const index_in_parent = await node_manager.execute_handler(
      "get_index_of_child",
      parent,
      node as any
    )!;

    return await execute_caret_navigate_from_selected_data(
      editor,
      {
        node: parent!,
        child_path: index_in_parent,
      },
      direction,
      CaretNavigateFrom.Child
    );
  } else if (decision_type === "enter_self") {
    // 接受进入，并把光标移动到指定位置。
    const decision = result as CaretNavigateEnterDecisionEnterSelf;
    return {
      node: selected_data.node,
      child_path: decision.to,
    };
  } else if (decision_type === "enter_child") {
    // 接受进入，交给此节点内部的指定节点处理。
    const decision = result as CaretNavigateEnterDecisionEnterChild;
    const child = await node_manager.execute_handler(
      "get_child",
      selected_data.node,
      decision.to
    );
    // 按照进入方向进行判断。
    return await execute_caret_navigate_from_selected_data(
      editor,
      // 如果是 next 进入的子节点，则尝试移动到子节点的头部。
      // 如果是 prev 进入的子节点，则尝试移动到子节点的尾部。
      {
        node: child!,
        child_path:
          direction === NavigateDirection.Next
            ? 0
            : Number.MAX_SAFE_INTEGER,
      },
      direction,
      CaretNavigateFrom.Parent
    );
  }
}
