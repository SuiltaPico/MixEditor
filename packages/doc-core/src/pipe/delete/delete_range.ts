import { Ent, MixEditor, Op, Transaction } from "@mixeditor/core";
import { DocCaret } from "../../selection";
import { get_common_ancestor_from_ent, get_parent } from "../../common/path";
import { execute_merge_ent } from "../merge_ent";

/** 节点对删除范围的决策。 */
export const DeleteRangeDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   * @default
   */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { operation?: Op; selected?: DocCaret }) => {
    const result = props as DeleteRangeDecision & { type: "done" };
    result.type = "done";
    return result;
  },
} as const;

export type DeleteRangeDecision =
  | {
      type: "delete_self";
    }
  | {
      type: "done";
      operation?: Op;
      selected?: DocCaret;
    };

export interface DeleteRangeContext {
  /** 要删除的起点。 */
  start: number;
  /** 要删除的终点。 */
  end: number;
}

export async function execute_same_ent_pure_delete_range(
  editor: MixEditor,
  tx: Transaction,
  ent: Ent,
  start_offset: number,
  end_offset: number
) {
  const ent_ctx = editor.ent;
  let current = ent;
  let temp_start_offset: number = start_offset;
  let temp_end_offset: number = end_offset;

  while (current) {
    const decision = await ent_ctx.exec_behavior(
      current,
      "doc:handle_delete_range",
      {
        start: temp_start_offset,
        end: temp_end_offset,
      }
    );

    if (!decision || decision.type === "delete_self") {
      // 获取父实体
      const parent = get_parent(ent_ctx, current);
      if (!parent) break; // 到达根实体，结束责任链

      // 获取当前节点在父节点中的索引
      const index_in_parent = await ent_ctx.exec_behavior(
        parent,
        "doc:index_of_child",
        {
          child: current,
        }
      );

      current = parent;
      temp_start_offset = index_in_parent!;
      temp_end_offset = index_in_parent! - 1;
    } else if (decision.type === "done") {
      if (decision.operation) {
        await tx.execute(decision.operation);
      }
      break;
    }
  }
}

/** 删除起始实体到公共祖先的祖先实体链中，在起始实体后侧的的每个部分。 */
export async function execute_diff_ent_pure_delete_start_part(
  editor: MixEditor,
  tx: Transaction,
  start: DocCaret,
  common_ancestor: Ent
) {
  const ent_ctx = editor.ent;
  let current = start.ent;
  let temp_start_offset: number = start.offset;

  while (current && current !== common_ancestor) {
    const decision = await ent_ctx.exec_behavior(
      current as any,
      "doc:handle_delete_range",
      {
        start: temp_start_offset,
        end: Number.MAX_SAFE_INTEGER,
      }
    );

    if (decision?.type === "done") {
      if (decision?.operation) {
        await tx.execute(decision.operation);
      }
      break;
    }

    // 获取父实体
    const parent = get_parent(ent_ctx, current);
    if (!parent) break; // 到达根实体，结束责任链

    // 获取当前实体在父实体中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:index_of_child",
      {
        child: current,
      }
    );

    current = parent;
    temp_start_offset = index_in_parent! + 1;
    // 如果当前实体是删除自身，则将删除范围把自己也算进去
    if (!decision || decision?.type === "delete_self") {
      temp_start_offset = index_in_parent!;
    }
  }
}

/** 删除结束实体到公共祖先的祖先实体链中，在结束实体前侧的的每个部分。 */
export async function execute_diff_ent_pure_delete_end_part(
  editor: MixEditor,
  tx: Transaction,
  end: DocCaret,
  common_ancestor: Ent
) {
  const ent_ctx = editor.ent;
  let current = end.ent;
  let temp_end_offset: number = end.offset;

  current = end.ent;
  temp_end_offset = end.offset;
  while (current && current !== common_ancestor) {
    const decision = await ent_ctx.exec_behavior(
      current,
      "doc:handle_delete_range",
      {
        start: 0,
        end: temp_end_offset,
      }
    );

    if (decision?.type === "done") {
      if (decision?.operation) {
        await tx.execute(decision.operation);
      }
      break;
    }

    // 获取父实体
    const parent = get_parent(ent_ctx, current);
    if (!parent) break; // 到达根实体，结束责任链

    // 获取当前实体在父实体中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:index_of_child",
      {
        child: current,
      }
    );

    current = parent;
    temp_end_offset = index_in_parent! - 1;

    // 如果当前实体是删除自身，则将删除范围把自己也算进去
  }
}

/** 删除公共祖先到结束节点的路径。 */
export async function execute_diff_ent_pure_delete_common_ancestor_range(
  editor: MixEditor,
  tx: Transaction,
  start_offset: number,
  end_offset: number,
  common_ancestor: Ent
) {
  const ent_ctx = editor.ent;
  // --- 处理公共祖先到结束节点的路径 ---

  let current = common_ancestor;
  let temp_start_offset = start_offset;
  let temp_end_offset = end_offset;
  while (current) {
    const decision = await ent_ctx.exec_behavior(
      current,
      "doc:handle_delete_range",
      {
        start: temp_start_offset,
        end: temp_end_offset,
      }
    );

    if (decision?.type === "done") {
      if (decision?.operation) {
        await tx.execute(decision.operation);
      }
      break;
    }

    // --- 否则则继续执行 delete_range 责任链 ---
    // 获取父节点
    const parent = get_parent(ent_ctx, current);
    if (!parent) break; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:index_of_child",
      {
        child: current,
      }
    );

    current = parent;
    temp_start_offset = index_in_parent!;
    temp_end_offset = index_in_parent! - 1;
  }
}

/** 删除两个光标之间的范围。 */
export async function execute_diff_ent_pure_delete_range(
  editor: MixEditor,
  tx: Transaction,
  start: DocCaret,
  end: DocCaret
) {
  const ent_ctx = editor.ent;
  const common_ancestor_data = await get_common_ancestor_from_ent(
    ent_ctx,
    start.ent,
    end.ent
  );
  if (!common_ancestor_data) return;
  const common_ancestor = common_ancestor_data.common_ancestor;

  await execute_diff_ent_pure_delete_start_part(
    editor,
    tx,
    start,
    common_ancestor
  );
  await execute_diff_ent_pure_delete_end_part(editor, tx, end, common_ancestor);
  await execute_diff_ent_pure_delete_common_ancestor_range(
    editor,
    tx,
    common_ancestor_data.path1[common_ancestor_data.ancestor_index] + 1,
    common_ancestor_data.path2[common_ancestor_data.ancestor_index] - 1,
    common_ancestor
  );
}

/** 删除范围，并处理合并逻辑。 */
export async function execute_delete_range(
  editor: MixEditor,
  tx: Transaction,
  start: DocCaret,
  end: DocCaret
) {
  // 执行删除逻辑
  if (start.ent === end.ent) {
    await execute_same_ent_pure_delete_range(
      editor,
      tx,
      start.ent,
      start.offset,
      end.offset
    );
  } else {
    await execute_diff_ent_pure_delete_range(editor, tx, start, end);
  }

  // 执行合并逻辑
  await execute_merge_ent(editor, tx, start.ent, end.ent);
}
