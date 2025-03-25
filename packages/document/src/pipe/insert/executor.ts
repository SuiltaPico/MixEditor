import {
  get_actual_child_compo,
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  get_parent_ent_id,
  MixEditor,
  Transaction,
  TreeCaret,
  TreeDeepSplitOp,
  TreeInsertChildrenOp,
  TreeSplitOp,
} from "@mixeditor/core";
import { execute_merge_ent } from "../merge";
import { DocInsertCb } from "./cb";

export const InsertDecisionReject = {
  type: "reject",
} satisfies InsertDecision;
export const InsertDecisionPrevent = {
  type: "prevent",
} satisfies InsertDecision;

/** 插入决策。 */
export const InsertDecision = {
  /** 允许插入。 */
  Accept(params: { methods: InsertMethod[] }) {
    const p = params as InsertDecision & { type: "accept" };
    p.type = "accept";
    return p;
  },
  /** 拒绝插入。 */
  Reject() {
    return InsertDecisionReject;
  },
  /** 阻止插入。 */
  Prevent() {
    return InsertDecisionPrevent;
  },
} as const;

export type InsertDecision =
  /** 允许插入。 */
  | { type: "accept"; methods: InsertMethod[] }
  /** 拒绝插入。 */
  | { type: "reject" }
  /** 阻止插入。 */
  | { type: "prevent" };

export const InsertMethodMerge = {
  type: "merge",
} satisfies InsertMethod;
export const InsertMethodInsert = {
  type: "insert",
} satisfies InsertMethod;

/** 插入方法。 */
export const InsertMethod = {
  /** 合并到实体。 */
  Merge() {
    return InsertMethodMerge;
  },
  /** 插入到实体。 */
  Insert() {
    return InsertMethodInsert;
  },
} as const;
export type InsertMethod =
  /** 合并到实体的 `index` 位置。 */
  | { type: "merge" }
  /** 插入到实体的 `index` 位置。 */
  | { type: "insert" };

export interface InsertContext {
  /** 当前导航实体 */
  ent_id: string;
  /** 要插入的位置索引。 */
  index: number;
  /** 要插入的实体列表。 */
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
export async function execute_full_insert_ents(
  editor: MixEditor,
  tx: Transaction,
  caret: TreeCaret,
  items: string[],
  child_split_caret?: number[]
): Promise<
  | {
      rejected?: string[];
      caret: TreeCaret;
    }
  | undefined
> {
  let result_caret: TreeCaret | undefined = caret;

  const { ecs, op } = editor;
  const { ent_id, offset } = caret;

  const actual_child_compo = get_actual_child_compo(ecs, ent_id);
  if (!actual_child_compo)
    return {
      rejected: items,
      caret: caret,
    };

  const decision =
    (await ecs.run_compo_behavior(actual_child_compo, DocInsertCb, {
      ent_id,
      index: offset,
      items: items,
    })) ?? InsertDecisionReject;

  console.log(
    "[execute_insert]",
    ecs.get_ent(ent_id),
    "decision",
    decision,
    "items",
    items
  );

  async function insert_items_to_ent(
    ent_id: string,
    ex_offset: number,
    ent_after_inserted?: string
  ) {
    const child_count_before_insert = get_child_ent_count(ecs, ent_id);
    // 将 items 每一项与自己合并
    // 例如源文档是 `Paragraph [Text [A] Text [B]]`，
    // 插入 `Text[C D]` 到 `A` 后面，因为 execute_merge_ent 会尝试向前深度合并
    // 则结果应该是 `Paragraph [Text [A C D] Text [B]]`
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const method = (decision as InsertDecision & { type: "accept" }).methods[
        i
      ];
      if (method.type === "merge") {
        await execute_merge_ent(
          editor,
          tx,
          ent_id,
          caret.offset + i + ex_offset,
          item
        );
      } else if (method.type === "insert") {
        await tx.execute(
          new TreeInsertChildrenOp(
            op.gen_id(),
            ent_id,
            caret.offset + i + ex_offset,
            [item]
          )
        );
      }
    }
    const child_count_after_insert = get_child_ent_count(ecs, ent_id);

    result_caret = {
      ent_id,
      offset:
        caret.offset +
        ex_offset +
        (child_count_after_insert - child_count_before_insert),
    };

    // 如果合并区域右侧有子实体，则尝试合并 items 最后一项和合并区域右侧的子实体
    // 这是为了完成上一个例子中，`Text [A C D]` 和 `Text [B]` 的合并
    // 最终我们可以得到 `Paragraph [Text [A C D B]]`
    if (ent_after_inserted) {
      const last_item = items[items.length - 1];
      const merge_result = await execute_merge_ent(
        editor,
        tx,
        last_item,
        get_child_ent_count(ecs, last_item),
        ent_after_inserted
      );
      if (merge_result.caret) {
        result_caret = merge_result.caret;
      }
    }
  }

  if (decision.type === "prevent") {
    // 阻止整个插入流程

    return {
      rejected: items,
      caret,
    };
  } else if (decision.type === "reject") {
    // 拒绝插入则交由父实体处理，并记录自己的分割位置

    const parent_ent_id = get_parent_ent_id(ecs, ent_id);
    if (!parent_ent_id)
      return {
        rejected: items,
        caret: caret,
      };
    const index_in_parent = get_index_of_child_ent(ecs, parent_ent_id, ent_id);

    const _child_split_caret = child_split_caret ?? [];
    _child_split_caret.unshift(caret.offset);

    return await execute_full_insert_ents(
      editor,
      tx,
      {
        ent_id: parent_ent_id,
        offset: index_in_parent,
      },
      items,
      _child_split_caret
    );
  } else if (decision.type === "accept") {
    let ex_offset = 0;
    if (child_split_caret && child_split_caret.length > 0) {
      // 如果有 `child_split_caret`，则将子实体分割
      // 例如源文档是 `Paragraph [Text [A B]]`
      // 一开始插入 `Paragraph[Text[C D] Text[E F]]` 到 `A` 后面，A 不能接受，则设置 `child_split_caret` 为 `[1]`，让 Paragraph 处理
      // Paragraph 能接受插入内容，则先分割 `A` 和 `B`，文档按照 `child_split_caret` 分割为 `Paragraph [Text [A] Text [B]]`
      // 然后让 `Paragraph` 合并完 `items` 后，得到 `Paragraph [Text [A] Text [C D] Text [E F] Text [B]]`
      // insert_items_to_ent 的处理会尝试合并所有可以合并的实体，最终得到 `Paragraph [Text [A C D E F B]]`

      // 因为要在分割后的两个实体之间插入，所以需要加偏移 1
      ex_offset = 1;

      const split_to = {
        ent_id: ent_id,
        offset: caret.offset + 1,
      };
      const child_to_split_id = get_child_ent_id(ecs, ent_id, caret.offset);
      if (!child_to_split_id)
        return {
          rejected: items,
          caret: caret,
        };
      if (child_split_caret.length === 1) {
        // 分割子实体
        await tx.execute(
          new TreeSplitOp(
            op.gen_id(),
            child_to_split_id,
            child_split_caret[0],
            split_to
          )
        );
      } else {
        // 深度分割子实体
        await tx.execute(
          new TreeDeepSplitOp(
            op.gen_id(),
            child_to_split_id,
            child_split_caret,
            split_to
          )
        );
      }
    }

    await insert_items_to_ent(
      ent_id,
      ex_offset,
      get_child_ent_id(ecs, ent_id, caret.offset + 1)
    );
  }

  return {
    rejected: items,
    caret: result_caret,
  };
}
