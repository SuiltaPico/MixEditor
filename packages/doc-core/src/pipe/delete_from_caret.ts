import {
  IPipeEvent,
  IPipeStage,
  IPipeStageHandler,
  MEEvent,
  MEPipeStageHandler,
  MixEditor,
} from "@mixeditor/core";
import {
  CollapsedDocSelection,
  DocNodeCaret,
  ExtendedDocSelection,
} from "../selection";

/** 驱使删除的来源。 */
export enum DeleteFromCaretSource {
  /** 父节点。 */
  Parent = "parent",
  /** 子节点。 */
  Child = "child",
}

/** 删除方向。 */
export enum DeleteFromCaretDirection {
  /** 向前删除。 */
  Next = 1,
  /** 向后删除。 */
  Prev = -1,
}

/** 节点对删除点的决策。 */
export const DeleteFromCaretDecision = {
  /** 跳过删除。删除将会交给自身的父节点处理。
   *
   * 例如，如果在 Text:0 上执行前向删除，Text 可以让删除移交给父节点进行处理。
   */
  Skip: { type: "skip" } satisfies DeleteFromCaretDecision,
  /** 让删除移交给自身子节点处理。
   *
   * 例如，如果在 Paragraph:2 上执行前向删除，Paragraph 可以让删除移交给 Paragraph[2] 的子节点进行处理。
   */
  Child: (index: number = 0) =>
    ({
      type: "child",
      index,
    } satisfies DeleteFromCaretDecision),
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   *
   * 例如，如果 Image 被选中后删除，则 Image 可以让删除移交给父节点对自己进行删除。
   */
  DeleteSelf: { type: "delete_self" } satisfies DeleteFromCaretDecision,
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { selected?: Selected }) =>
    ({
      type: "done",
      selected: props.selected,
    } satisfies DeleteFromCaretDecision),
};

/** 删除决策。 */
export type DeleteFromCaretDecision =
  | { type: "skip" } // 跳过当前节点
  | { type: "child"; index: number } // 进入子节点
  | { type: "delete_self" } // 删除自身
  | { type: "done"; selected?: Selected }; // 已处理完成

/** 删除策略上下文。 */
export interface DeleteFromCaretContext {
  /** 要删除的方向。 */
  direction: DeleteFromCaretDirection;
  /** 请求删除的来源。 */
  src?: DeleteFromCaretSource;
  /** 删除的起点。 */
  from: number;
}

/** 从指定点执行删除操作。 */
export async function execute_delete_directed(
  editor: MixEditor,
  selected_data: SelectedData,
  direction: DeleteFromCaretDirection,
  src?: DeleteFromCaretSource
): Promise<
  | {
      selected?: Selected;
    }
  | undefined
> {
  const ent_ctx = editor.ent;
  const to_prev = direction === DeleteFromCaretDirection.Prev;

  // 执行当前节点的删除处理
  const decision = await ent_ctx.exec_behavior(
    selected_data.node,
    "doc:handle_delete_from_caret",
    {
      direction,
      src,
      from: selected_data.child_path,
    }
  );

  if (!decision || decision.type === "delete_self") {
    // 获取父节点
    const parent = ent_ctx.get_domain_ctx("doc", selected_data.node)?.parent;
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:get_index_of_child",
      selected_data.node
    )!;

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
  } else if (decision.type === "done") {
    return { operation: decision.operation, selected: decision.selected };
  } else if (decision.type === "skip") {
    // 处理 Skip 决策：将删除操作交给父节点处理
    const parent = ent_ctx.get_domain_ctx("doc", selected_data.node)?.parent;
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:get_index_of_child",
      selected_data.node
    )!;

    // 递归处理父节点的删除
    return await execute_delete_directed(
      editor,
      {
        node: parent,
        child_path: to_prev ? index_in_parent! - 1 : index_in_parent!,
      },
      direction,
      DeleteFromCaretSource.Child
    );
  } else if (decision.type === "child") {
    // 处理 Child 决策：将删除操作交给指定子节点处理
    const child_node = await ent_ctx.exec_behavior(
      selected_data.node,
      "doc:get_child",
      {
        index: decision.index,
      }
    );

    if (!child_node) return; // 子节点不存在时终止

    // 递归处理子节点的删除
    return await execute_delete_directed(
      editor,
      {
        node: child_node,
        child_path: to_prev ? Number.MAX_SAFE_INTEGER : 0,
      },
      direction,
      DeleteFromCaretSource.Parent
    );
  }
}

export interface DeleteDirectedEvent extends MEEvent {
  type: "doc:delete_directed";
  direction: DeleteFromCaretDirection;

  new_selection: Selected;
}

export interface SelectedData {
  node: any;
  child_path: number;
}

export type Selected = CollapsedDocSelection | ExtendedDocSelection;

export const delete_directed_pipe_handler: IPipeStageHandler<
  DeleteDirectedEvent,
  MixEditor
> = async (event, wait_deps) => {
  await wait_deps();
  const editor = event.ex_ctx;

  const selected = editor.selection.get_selected();
  if (!selected) return;

  let result;
  if (selected.type === "doc:collapsed") {
    // 折叠选区执行删除操作
    try {
      result = await execute_delete_directed(
        editor,
        {
          node: selected.caret.ent,
          child_path: selected.caret.offset,
        },
        event.direction
      );
      if (!result) return;
    } catch (e) {
      // 决策失败，取消删除
      return;
    }
  } else if (selected.type === "doc:extended") {
    // 扩展选区执行删除范围操作
    result = {
      operation: await execute_delete_range(
        editor,
        {
          node: selected.start.ent,
          child_path: selected.start.offset,
        },
        {
          node: selected.end.ent,
          child_path: selected.end.offset,
        }
      ),
    };
  }

  // 执行操作和更新选择
  if (result?.operation) {
    // 在重构后的代码中，可能需要使用新的API来执行操作
    // 此处暂时留空，由使用者根据实际API进行适配
    console.warn("执行删除操作需要适配新的API");
  }

  if (result?.selected) {
    editor.selection.set_selected(result.selected);
  }
};

export const register_delete_directed_pipe = (editor: MixEditor) => {
  editor.pipe.set_pipe("doc:delete_directed", [
    {
      id: "handle_delete_directed",
      execute: delete_directed_pipe_handler,
    } as IPipeStage<IPipeEvent<any>, MixEditor>,
  ]);
};
