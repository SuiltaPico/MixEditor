import {
  IPipeEvent,
  IPipeStage,
  IPipeStageHandler,
  MEEvent,
  MixEditor,
  Op,
  Transaction
} from "@mixeditor/core";
import { get_parent } from "../../common/path";
import {
  DocNodeCaret,
  DocSelection
} from "../../selection";
import { execute_delete_range } from "./delete_range";

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
  Done: (props: { operation: Op; selected?: DocSelection }) =>
    ({
      type: "done",
      selected: props.selected,
      operation: props.operation,
    } satisfies DeleteFromCaretDecision),
};

/** 删除决策。 */
export type DeleteFromCaretDecision =
  | { type: "skip" } // 跳过当前节点
  | { type: "child"; index: number } // 进入子节点
  | { type: "delete_self" } // 删除自身
  | { type: "done"; operation: Op; selected?: DocSelection }; // 已处理完成

/** 删除策略上下文。 */
export interface DeleteFromCaretContext {
  /** 要删除的方向。 */
  direction: DeleteFromCaretDirection;
  /** 请求删除的来源。 */
  src?: DeleteFromCaretSource;
  /** 删除的起点。 */
  from: number;
}

/** 从光标执行删除操作。 */
export async function execute_delete_from_caret(
  editor: MixEditor,
  tx: Transaction,
  caret: DocNodeCaret,
  direction: DeleteFromCaretDirection,
  src?: DeleteFromCaretSource
): Promise<
  | {
      selected?: DocSelection;
    }
  | undefined
> {
  const ent_ctx = editor.ent;
  const to_prev = direction === DeleteFromCaretDirection.Prev;

  // 执行当前节点的删除处理
  const decision = await ent_ctx.exec_behavior(
    caret.ent,
    "doc:handle_delete_from_caret",
    {
      direction,
      src,
      from: caret.offset,
    }
  );

  if (!decision || decision.type === "delete_self") {
    // 获取父节点
    const parent = get_parent(ent_ctx, caret.ent);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:get_index_of_child",
      caret.ent
    )!;

    await execute_delete_range(
      editor,
      tx,
      {
        ent: parent,
        offset: index_in_parent! - 1,
      },
      {
        ent: parent,
        offset: index_in_parent!,
      }
    );
  } else if (decision.type === "done") {
    await tx.execute(decision.operation);
    return { selected: decision.selected };
  } else if (decision.type === "skip") {
    // 处理 Skip 决策：将删除操作交给父节点处理
    const parent = get_parent(ent_ctx, caret.ent);
    if (!parent) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:get_index_of_child",
      caret.ent
    )!;

    // 递归处理父节点的删除
    return await execute_delete_from_caret(
      editor,
      tx,
      {
        ent: parent,
        offset: to_prev ? index_in_parent! - 1 : index_in_parent!,
      },
      direction,
      DeleteFromCaretSource.Child
    );
  } else if (decision.type === "child") {
    // 处理 Child 决策：将删除操作交给指定子节点处理
    const child_node = await ent_ctx.exec_behavior(caret.ent, "doc:get_child", {
      index: decision.index,
    });

    if (!child_node) return; // 子节点不存在时终止

    // 递归处理子节点的删除
    return await execute_delete_from_caret(
      editor,
      tx,
      {
        ent: child_node,
        offset: to_prev ? Number.MAX_SAFE_INTEGER : 0,
      },
      direction,
      DeleteFromCaretSource.Parent
    );
  }
}
