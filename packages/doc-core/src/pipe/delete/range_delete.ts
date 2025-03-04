import { Ent, MixEditor, Op, Transaction, TreeCaret, get_common_ancestor_from_ent, get_parent } from "@mixeditor/core";
import { execute_merge_ent } from "../merge_ent";

/** 节点对删除范围的决策。 */
export const RangeDeleteDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   * @default
   */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { operation?: Op; selected?: TreeCaret }) => {
    const result = props as RangeDeleteDecision & { type: "done" };
    result.type = "done";
    return result;
  },
} as const;

export type RangeDeleteDecision =
  | {
      type: "delete_self";
    }
  | {
      type: "done";
      operation?: Op;
      selected?: TreeCaret;
    };

export interface RangeDeleteContext {
  /** 要删除的起点。 */
  start: number;
  /** 要删除的终点。 */
  end: number;
}

/**
 * 处理同一实体内的范围删除
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param ent 要操作的实体
 * @param start_offset 删除起始偏移量
 * @param end_offset 删除结束偏移量
 */
export async function delete_range_in_same_ent(
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
    // 执行实体删除范围处理行为
    const decision = await ent_ctx.exec_behavior(
      current,
      "doc:handle_delete_range",
      {
        start: temp_start_offset,
        end: temp_end_offset,
      }
    );

    if (!decision || decision.type === "delete_self") {
      // 向上查找可处理删除的父级实体
      const parent = get_parent(ent_ctx, current);
      if (!parent) break; // 已到达根实体，终止处理

      // 计算当前实体在父实体中的索引位置
      const index_in_parent = await ent_ctx.exec_behavior(
        parent,
        "doc:index_of_child",
        { child: current }
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

/**
 * 处理跨实体范围删除
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param start 起始光标位置
 * @param end 结束光标位置
 */
export async function delete_between_ents(
  editor: MixEditor,
  tx: Transaction,
  start: TreeCaret,
  end: TreeCaret
) {
  const ent_ctx = editor.ent;
  const common_ancestor_data = await get_common_ancestor_from_ent(
    ent_ctx,
    start.ent,
    end.ent
  );
  if (!common_ancestor_data) return;
  const common_ancestor = common_ancestor_data.common_ancestor;

  await delete_start_to_ancestor(editor, tx, start, common_ancestor);
  await delete_end_to_ancestor(editor, tx, end, common_ancestor);

  // 处理公共祖先实体内的中间范围删除
  await delete_ancestor_range(
    editor,
    tx,
    common_ancestor_data.path1[common_ancestor_data.ancestor_index] + 1,
    common_ancestor_data.path2[common_ancestor_data.ancestor_index] - 1,
    common_ancestor
  );
}

/**
 * 沿起始实体到公共祖先路径执行删除操作
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param start 起始光标位置（包含实体和偏移量）
 * @param common_ancestor 公共祖先实体
 *
 * 处理从起始位置到公共祖先路径右侧的所有可删除内容
 */
export async function delete_start_to_ancestor(
  editor: MixEditor,
  tx: Transaction,
  start: TreeCaret,
  common_ancestor: Ent
) {
  const ent_ctx = editor.ent;
  let current = start.ent;
  let temp_start_offset: number = start.offset;

  while (current && current !== common_ancestor) {
    // 尝试在当前实体处理右侧删除（从偏移量到末尾）
    const decision = await ent_ctx.exec_behavior(
      current as any,
      "doc:handle_delete_range",
      {
        start: temp_start_offset,
        end: Number.MAX_SAFE_INTEGER, // 表示删除到当前实体末尾
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

/**
 * 沿结束实体到公共祖先路径执行删除操作
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param end 结束光标位置（包含实体和偏移量）
 * @param common_ancestor 公共祖先实体
 *
 * 处理从结束位置到公共祖先路径左侧的所有可删除内容
 */
export async function delete_end_to_ancestor(
  editor: MixEditor,
  tx: Transaction,
  end: TreeCaret,
  common_ancestor: Ent
) {
  const ent_ctx = editor.ent;
  let current = end.ent;
  let temp_end_offset: number = end.offset;

  current = end.ent;
  temp_end_offset = end.offset;
  while (current && current !== common_ancestor) {
    // 尝试在当前实体处理左侧删除（从开始到偏移量）
    const decision = await ent_ctx.exec_behavior(
      current,
      "doc:handle_delete_range",
      {
        start: 0, // 表示从当前实体起始位置开始
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

/**
 * 在公共祖先实体中执行范围删除
 * @param editor 编辑器实例
 * @param tx 事务对象
 * @param start_offset 在公共祖先中的起始偏移量
 * @param end_offset 在公共祖先中的结束偏移量
 * @param common_ancestor 公共祖先实体
 *
 * 处理公共祖先实体内部指定范围的直接删除操作
 */
export async function delete_ancestor_range(
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

/** 删除范围，并处理合并逻辑。 */
export async function execute_range_deletion(
  editor: MixEditor,
  tx: Transaction,
  start: TreeCaret,
  end: TreeCaret
) {
  // 执行删除逻辑
  if (start.ent === end.ent) {
    await delete_range_in_same_ent(
      editor,
      tx,
      start.ent,
      start.offset,
      end.offset
    );
  } else {
    await delete_between_ents(editor, tx, start, end);
  }

  // 执行合并逻辑
  await execute_merge_ent(editor, tx, start.ent, end.ent);
}
