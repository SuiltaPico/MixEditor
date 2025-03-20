import {
  Ent,
  MESelection,
  MixEditor,
  Op,
  Transaction,
  TreeCaret,
  get_actual_child_compo,
  get_index_of_child_ent,
  get_lca_of_ent,
  get_parent_ent_id,
  process_shallow_nodes,
} from "@mixeditor/core";
import { DocRangeDeleteCb } from "./compo_behavior";
import { execute_merge_ent } from "../merge";

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

export async function delete_ent_range(
  editor: MixEditor,
  tx: Transaction,
  ent_id: string,
  start_offset: number,
  end_offset: number
) {
  const ecs_ctx = editor.ecs;
  const actual_child_compo = get_actual_child_compo(ecs_ctx, ent_id);
  if (!actual_child_compo) return;

  await ecs_ctx.run_compo_behavior(
    actual_child_compo,
    DocRangeDeleteCb,
    {
      ent_id,
      tx,
      start: start_offset,
      end: end_offset,
    }
  );
}

/** 删除范围，并处理合并逻辑。 */
export async function execute_range_deletion(
  editor: MixEditor,
  tx: Transaction,
  start: TreeCaret,
  end: TreeCaret
) {
  let result;

  const ecs = editor.ecs;
  const promises: Promise<void>[] = [];
  process_shallow_nodes(
    ecs,
    start.ent_id,
    start.offset,
    end.ent_id,
    end.offset,
    (ent_id, start_offset, end_offset) => {
      console.log(
        "[delete_ent_range]",
        ecs.get_ent(ent_id),
        ent_id,
        start_offset,
        end_offset
      );

      promises.push(
        delete_ent_range(editor, tx, ent_id, start_offset, end_offset)
      );
    }
  );

  await Promise.all(promises);

  // 执行合并逻辑
  await execute_merge_ent(editor, tx, start.ent_id, end.ent_id);

  return result;
}
