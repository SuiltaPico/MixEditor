import {
  get_actual_child_compo,
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  get_parent_ent_id,
  MixEditor,
  Transaction,
  TreeCaret,
  TreeInsertChildrenOp,
  TreeSplitOp,
} from "@mixeditor/core";
import { DocInsertCb } from "./cb";
import { clamp } from "@mixeditor/common";

export const InsertDecisionAccepted = {
  type: "accept",
} as const;
export const InsertDecisionNoneAccepted = {
  type: "partial_accept",
  rejected_from: 0,
  rejected_to: Number.MAX_SAFE_INTEGER,
} as const;
export const InsertDecisionPrevent = { type: "prevent" } as const;

/** 插入决策。 */
export const InsertDecision = {
  /** 允许插入。 */
  Accept() {
    return InsertDecisionAccepted;
  },
  /** 允许部分插入。*/
  PartialAccept(params: { rejected_from: number; rejected_to: number }) {
    const p = params as InsertDecision & { type: "partial_accept" };
    p.type = "partial_accept";
    return p;
  },
  /** 阻止插入。 */
  Prevent() {
    return InsertDecisionPrevent;
  },
} as const;

export type InsertDecision =
  | { type: "accept" }
  | {
      type: "partial_accept";
      /** 被拒绝插入的实体的起始位置索引。 */
      rejected_from: number;
      /** 被拒绝插入的实体的结束位置索引。 */
      rejected_to: number;
    }
  | { type: "prevent" };

export interface InsertContext {
  /** 当前导航实体 */
  ent_id: string;
  /** 要插入的位置索引。 */
  index: number;
  /** 要插入的实体。 */
  items: string[];
}

/** 在实体的 `index` 位置插入一组实体 `items`。
 *
 * * 如果实体能完全接受插入的实体，则直接插入。
 * * 如果实体不能完全接受插入的实体，则在实体的 `index` 进行分割，向分割后的左右两边分别插入允许接受的实体。然后让父节点处理剩余的实体。
 * * 如果实体阻止插入实体，则会结束插入流程。
 *
 * 返回没有被任何实体接受的实体。
 */
export async function execute_insert(
  editor: MixEditor,
  tx: Transaction,
  caret: TreeCaret,
  items: string[]
) {
  const { ecs, op } = editor;
  const { ent_id, offset } = caret;

  const actual_child_compo = get_actual_child_compo(ecs, ent_id);
  if (!actual_child_compo)
    return {
      rejected: items,
      caret: caret,
    };

  let decision = await ecs.run_compo_behavior(actual_child_compo, DocInsertCb, {
    ent_id,
    index: offset,
    items,
  });
  if (!decision) {
    decision = InsertDecisionNoneAccepted;
  }

  console.log(
    "[execute_insert]",
    ecs.get_ent(ent_id),
    "decision",
    decision,
    "items",
    items
  );

  if (decision.type === "prevent") {
    return {
      rejected: items,
      caret,
    };
  } else if (decision.type === "accept") {
    const ori_child_count = get_child_ent_count(ecs, ent_id);
    await tx.execute(
      new TreeInsertChildrenOp(op.gen_id(), ent_id, offset, items)
    );
    const new_child_count = get_child_ent_count(ecs, ent_id);
    return {
      rejected: undefined,
      caret: {
        ent_id: ent_id,
        offset: offset + new_child_count - ori_child_count,
      },
    };
  } else if (decision.type === "partial_accept") {
    const rejected_from = clamp(decision.rejected_from, 0, items.length);
    const rejected_to = clamp(decision.rejected_to, 0, items.length);

    if (rejected_from >= rejected_to) {
      const ori_child_count = get_child_ent_count(ecs, ent_id);
      // 视为全接受
      await tx.execute(
        new TreeInsertChildrenOp(op.gen_id(), ent_id, offset, items)
      );
      const new_child_count = get_child_ent_count(ecs, ent_id);
      return {
        rejected: undefined,
        caret: {
          ent_id: ent_id,
          offset: offset + new_child_count - ori_child_count,
        },
      };
    }

    const left_accepted_items = items.slice(0, rejected_from);
    const right_accepted_items = items.slice(rejected_to);
    const rejected_items = items.slice(rejected_from, rejected_to);

    const parent_ent_id = get_parent_ent_id(ecs, ent_id);
    if (!parent_ent_id)
      return {
        rejected: items,
        caret: caret,
      };

    const index_in_parent = get_index_of_child_ent(ecs, parent_ent_id, ent_id);
    if (index_in_parent < 0)
      return {
        rejected: items,
        caret: caret,
      };

    await tx.execute(
      new TreeSplitOp(op.gen_id(), ent_id, index_in_parent, {
        ent_id: parent_ent_id,
        offset: index_in_parent + 1,
      })
    );

    const splited_ent_id = get_child_ent_id(
      ecs,
      parent_ent_id,
      index_in_parent + 1
    );
    if (!splited_ent_id)
      return {
        rejected: items,
        caret: caret,
      };

    await tx.execute(
      new TreeInsertChildrenOp(
        op.gen_id(),
        splited_ent_id,
        get_child_ent_count(ecs, ent_id),
        left_accepted_items
      )
    );

    await tx.execute(
      new TreeInsertChildrenOp(
        op.gen_id(),
        splited_ent_id,
        0,
        right_accepted_items
      )
    );

    return await execute_insert(
      editor,
      tx,
      {
        ent_id: parent_ent_id,
        offset: index_in_parent + 1,
      },
      rejected_items
    );
  }
}
