import {
  create_TreeCollapsedSelection,
  get_actual_child_compo,
  get_child_ent_id,
  get_index_in_parent_ent,
  get_index_of_child_ent,
  get_parent_ent_id,
  MESelection,
  MixEditor,
  Op,
  Transaction,
  TreeCaret,
  TreeCollapsedSelectionType,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import { execute_range_deletion } from "./range_delete";
import { DocCaretDeleteCb } from "./compo_behavior";
import {
  CaretDirection,
  execute_navigate_caret_from_pos,
} from "../caret_navigate";

/** 驱使删除的来源。 */
export enum CaretDeleteSource {
  /** 父节点。 */
  Parent = "parent",
  /** 子节点。 */
  Child = "child",
}

/** 删除方向。 */
export enum CaretDeleteDirection {
  /** 向前删除。 */
  Next = 1,
  /** 向后删除。 */
  Prev = -1,
}

/** 节点对删除点的决策。 */
export const CaretDeleteDecision = {
  /** 跳过删除。删除将会交给自身的父节点处理。
   *
   * 例如，如果在 Text:0 上执行前向删除，Text 可以让删除移交给父节点进行处理。
   */
  Skip: { type: "skip" } satisfies CaretDeleteDecision,
  /** 让删除移交给自身子节点处理。
   *
   * 例如，如果在 Paragraph:2 上执行前向删除，Paragraph 可以让删除移交给 Paragraph[2] 的子节点进行处理。
   */
  Child: (index: number = 0) =>
    ({
      type: "child",
      index,
    } satisfies CaretDeleteDecision),
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   *
   * 例如，如果 Image 被选中后删除，则 Image 可以让删除移交给父节点对自己进行删除。
   */
  DeleteSelf: { type: "delete_self" } satisfies CaretDeleteDecision,
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { selected?: MESelection }) =>
    ({
      type: "done",
      selection: props.selected,
    } satisfies CaretDeleteDecision),
};

/** 删除决策。 */
export type CaretDeleteDecision =
  | { type: "skip" } // 跳过当前节点
  | { type: "child"; index: number } // 进入子节点
  | { type: "delete_self" } // 删除自身
  | { type: "done"; selection?: MESelection }; // 已处理完成

/** 删除策略上下文。 */
export interface CaretDeleteContext {
  /** 要删除的实体。 */
  ent_id: string;
  /** 要删除的方向。 */
  direction: CaretDeleteDirection;
  /** 请求删除的来源。 */
  src?: CaretDeleteSource;
  /** 删除的起点。 */
  from: number;
  /** 事务。 */
  tx: Transaction;
}

/** 从光标执行删除操作。 */
export async function execute_caret_deletion(
  editor: MixEditor,
  tx: Transaction,
  caret: TreeCaret,
  direction: CaretDeleteDirection,
  src?: CaretDeleteSource
): Promise<{
  selection?: MESelection;
} | void> {
  const { ecs, selection } = editor;
  const caret_ent_id = caret.ent_id;
  const caret_ent = ecs.get_ent(caret_ent_id);
  if (!caret_ent) return;

  const to_prev = direction === CaretDeleteDirection.Prev;

  const actual_child_compo = get_actual_child_compo(ecs, caret_ent_id);
  if (!actual_child_compo) return;

  // 执行当前节点的删除处理
  const decision = await ecs.run_compo_behavior(
    actual_child_compo,
    DocCaretDeleteCb,
    {
      ent_id: caret_ent_id,
      direction,
      src,
      from: caret.offset,
      tx,
    }
  );

  console.log(
    "execute_caret_deletion",
    caret_ent_id,
    direction,
    src,
    caret.offset,
    decision
  );

  if (!decision || decision.type === "delete_self") {
    // 获取父节点
    const parent_ent_id = get_parent_ent_id(ecs, caret_ent_id);
    if (!parent_ent_id) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = get_index_in_parent_ent(ecs, caret_ent_id);

    const delete_caret = {
      ent_id: parent_ent_id,
      offset: index_in_parent!,
    };

    return await execute_range_deletion(editor, tx, delete_caret, delete_caret);
  } else if (decision.type === "done") {
    return { selection: decision.selection };
  } else if (decision.type === "skip") {
    // 处理 Skip 决策：将删除操作交给父节点处理
    const parent_ent_id = get_parent_ent_id(ecs, caret_ent_id);
    if (!parent_ent_id) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = get_index_of_child_ent(
      ecs,
      parent_ent_id,
      caret_ent_id
    );

    // 递归处理父节点的删除
    return await execute_caret_deletion(
      editor,
      tx,
      {
        ent_id: parent_ent_id,
        offset: to_prev ? index_in_parent! - 1 : index_in_parent!,
      },
      direction,
      CaretDeleteSource.Child
    );
  } else if (decision.type === "child") {
    // 处理 Child 决策：将删除操作交给指定子节点处理
    const child_ent_id = get_child_ent_id(ecs, caret_ent_id, decision.index);

    if (!child_ent_id) return; // 子节点不存在时终止

    // 递归处理子节点的删除
    return await execute_caret_deletion(
      editor,
      tx,
      {
        ent_id: child_ent_id,
        offset: to_prev ? Number.MAX_SAFE_INTEGER : 0,
      },
      direction,
      CaretDeleteSource.Parent
    );
  }
}
