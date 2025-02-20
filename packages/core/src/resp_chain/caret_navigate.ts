import { NavigateDirection } from "../common/navigate";
import { MixEditor } from "../mixeditor";
import { SelectedData } from "../selection";

export enum CaretNavigateSource {
  Parent = "parent",
  Child = "child",
}

export type CaretNavigateDecisionEnterSelf = {
  type: "enter_self";
  to: number;
};
export type CaretNavigateDecisionEnterChild = {
  type: "enter_child";
  to: number;
};
export type CaretNavigateDecisionSkip = {
  type: "skip";
};

export const CaretNavigateDecision = {
  /** 不接受进入，跳过当前节点。 */
  Skip: { type: "skip" } satisfies CaretNavigateDecisionSkip,
  /** 接受进入，并把光标移动到指定位置。 */
  Enter: (to: number = 0) =>
    ({ type: "enter_self", to } satisfies CaretNavigateDecisionEnterSelf),
  /** 接受进入，交给此节点内部的指定节点处理。 */
  EnterChild: (to: number = 0) =>
    ({
      type: "enter_child",
      to,
    } satisfies CaretNavigateDecisionEnterChild),
};

export type CaretNavigateDecision =
  | CaretNavigateDecisionEnterSelf
  | CaretNavigateDecisionEnterChild
  | CaretNavigateDecisionSkip;

export interface CaretNavigateStrategyContext {
  /** 要移动的方向。 */
  direction: NavigateDirection;
  /** 请求移动的来源。 */
  src?: CaretNavigateSource;
  /** 要移动到的位置。 */
  from: number;
}

export interface CaretNavigateStrategyConfig {
  context: CaretNavigateStrategyContext;
  decision: CaretNavigateDecision;
}

export async function execute_caret_navigate_from_selected_data(
  editor: MixEditor,
  selected_data: SelectedData,
  direction: NavigateDirection,
  src?: CaretNavigateSource
): Promise<SelectedData | undefined> {
  const node_manager = editor.node_manager;

  const result = await node_manager.get_decision(
    "caret_navigate",
    selected_data.node as any,
    {
      direction,
      src,
      from: selected_data.child_path,
    }
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
      CaretNavigateSource.Child
    );
  } else if (decision_type === "enter_self") {
    // 接受进入，并把光标移动到指定位置。
    const decision = result as CaretNavigateDecisionEnterSelf;
    return {
      node: selected_data.node,
      child_path: decision.to,
    };
  } else if (decision_type === "enter_child") {
    // 接受进入，交给此节点内部的指定节点处理。
    const decision = result as CaretNavigateDecisionEnterChild;
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
          direction === NavigateDirection.Next ? 0 : Number.MAX_SAFE_INTEGER,
      },
      direction,
      CaretNavigateSource.Parent
    );
  }
}
