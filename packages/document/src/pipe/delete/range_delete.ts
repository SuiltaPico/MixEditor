import {
  Ent,
  MESelection,
  MixEditor,
  Op,
  Transaction,
  TreeCaret,
  create_TreeCollapsedSelection,
  get_actual_child_compo,
  get_index_in_parent_ent,
  get_index_of_child_ent,
  get_lca_of_ent,
  get_parent_ent_id,
  process_shallow_nodes,
} from "@mixeditor/core";
import { DocRangeDeleteCb } from "./compo_behavior";
import { execute_merge_ent } from "../merge";
import {
  CaretDirection,
  CaretNavigateSource,
  execute_navigate_caret_from_pos,
} from "../caret_navigate";

/** 节点对删除范围的决策。 */
export const RangeDeleteDecision = {
  /** 自身节点不处理删除，直接选中自己后进入 `delete_range` 流程。
   * @default
   */
  DeleteSelf: {
    type: "delete_self",
  },
  /** 自身节点已经处理了删除，并产生了要执行的操作。 */
  Done: (props: { selection?: MESelection }) => {
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
      selection?: MESelection;
    };

export interface RangeDeleteContext {
  /** 要操作的实体。 */
  ent_id: string;
  /** 要删除的起点。 */
  start: number;
  /** 要删除的终点。 */
  end: number;
  /** 事务对象。 */
  tx: Transaction;
}

/** 删除单个实体范围。 */
export async function delete_ent_range(
  editor: MixEditor,
  tx: Transaction,
  ent_id: string,
  start_offset: number,
  end_offset: number
) {
  console.log(
    "[delete_ent_range]",
    editor.ecs.get_ent(ent_id),
    ent_id,
    start_offset,
    end_offset
  );

  const ecs_ctx = editor.ecs;
  const actual_child_compo = get_actual_child_compo(ecs_ctx, ent_id);
  if (!actual_child_compo) return;

  const decision = await ecs_ctx.run_compo_behavior(
    actual_child_compo,
    DocRangeDeleteCb,
    {
      ent_id,
      tx,
      start: start_offset,
      end: end_offset,
    }
  );

  if (!decision || decision.type === "done") {
    return;
  } else if (decision.type === "delete_self") {
    // 获取父节点
    const parent_ent_id = get_parent_ent_id(ecs_ctx, ent_id);
    if (!parent_ent_id) return; // 到达根节点，结束责任链

    // 获取当前节点在父节点中的索引
    const index_in_parent = get_index_in_parent_ent(ecs_ctx, ent_id);

    return await delete_ent_range(
      editor,
      tx,
      parent_ent_id,
      index_in_parent!,
      index_in_parent!
    );
  }
}

/** 删除范围，并处理合并逻辑。 */
export async function execute_range_deletion(
  editor: MixEditor,
  tx: Transaction,
  start: TreeCaret,
  end: TreeCaret
) {
  let selection: MESelection | undefined;

  console.log("[execute_range_deletion]", start, end);

  const ecs = editor.ecs;

  // 遍历所有浅层节点，并删除
  const promises: Promise<void>[] = [];
  process_shallow_nodes(
    ecs,
    start.ent_id,
    start.offset,
    end.ent_id,
    end.offset,
    (ent_id, start_offset, end_offset) => {
      promises.push(
        delete_ent_range(editor, tx, ent_id, start_offset, end_offset)
      );
    }
  );
  await Promise.all(promises);

  // 执行合并逻辑
  const merge_result = await execute_merge_ent(
    editor,
    tx,
    start.ent_id,
    end.ent_id
  );
  if (merge_result.selection) {
    selection = merge_result.selection;
  } else {
    console.log("navigate_caret_from_pos", start);

    const new_selection = await execute_navigate_caret_from_pos(
      editor,
      start,
      CaretDirection.None,
      CaretNavigateSource.Child
    );
    if (new_selection) {
      console.log("navigate_caret_from_pos normalized", new_selection);
      selection = create_TreeCollapsedSelection(new_selection);
    }
  }

  return { selection };
}
