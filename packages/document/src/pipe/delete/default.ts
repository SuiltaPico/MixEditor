import {
  create_TreeCollapsedSelection,
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  get_parent_ent_id,
  MECompoBehaviorMap,
  MixEditor,
  Transaction,
  TreeChildrenDeleteOp,
} from "@mixeditor/core";
import {
  CaretDeleteDecision,
  CaretDeleteDirection,
  CaretDeleteSource,
  DocCaretDeleteCb,
  DocRangeDeleteCb,
  RangeDeleteDecision,
} from ".";
import {
  BackBorderStrategy,
  BorderType,
  DocConfigCompo,
  FrontBorderStrategy,
} from "../../compo";
import {
  CaretDirection,
  execute_navigate_caret_from_pos,
} from "../caret_navigate";
import { execute_merge_ent } from "../merge";

/** 默认的光标删除处理逻辑。
 *
 * 根据 DocEntTraitsCompo 定义的删除策略进行处理。
 */
export const handle_default_caret_delete: MECompoBehaviorMap[typeof DocCaretDeleteCb] =
  async (params) => {
    const { from, direction, ent_id, ex_ctx: editor, tx, src } = params;
    const { ecs, op } = editor;

    const doc_config = ecs.get_compo(ent_id, DocConfigCompo.type) as
      | DocConfigCompo
      | undefined;
    if (!doc_config) return CaretDeleteDecision.Done({});

    console.log(
      "默认光标删除组件行为",
      ecs.get_ent(ent_id),
      "from:",
      params.from,
      "direction:",
      params.direction,
      "src:",
      params.src,
      "[handle_default_caret_delete]"
    );

    // 如果有自定义删除处理函数，优先使用
    if (doc_config.custom_caret_delete)
      return doc_config.custom_caret_delete(params);

    const caret_delete_policy = doc_config.caret_delete_policy.get();
    const front_border_strategy = doc_config.front_border_strategy.get();
    const back_border_strategy = doc_config.back_border_strategy.get();
    const border_type = doc_config.border_policy.get();
    const child_count = get_child_ent_count(ecs, ent_id);

    // 根据删除策略进行处理
    if (caret_delete_policy.type === "skip")
      return CaretDeleteDecision.Done({});

    let delete_index = from;

    if (src === CaretDeleteSource.Parent || src === CaretDeleteSource.Child) {
      // 从父实体或子实体传递，使用的是位置索引。从自身传递，使用的是实体索引，所以不用处理。
      delete_index = from + (CaretDeleteDirection.Prev ? -1 : 0);
    }

    if (child_count === 0) {
      return CaretDeleteDecision.DeleteSelf;
    }

    // 处理位置索引位于边界的情况，如果前向删除且在文档开头或者后向删除且在文档末尾
    if (
      border_type === BorderType.Closed &&
      ((direction === CaretDeleteDirection.Prev && delete_index <= 0) ||
        (direction === CaretDeleteDirection.Next &&
          delete_index >= child_count))
    ) {
      const border_processed_result = await handle_border_strategy(
        direction === CaretDeleteDirection.Prev
          ? front_border_strategy
          : back_border_strategy,
        params,
        editor,
        tx,
        ent_id,
        direction
      );
      if (border_processed_result) return border_processed_result;
    }

    if (child_count === 0) {
      return CaretDeleteDecision.DeleteSelf;
    } else if (delete_index < 0) {
      delete_index = 0;
    } else if (delete_index > child_count - 1) {
      delete_index = child_count - 1;
    }

    if (src === CaretDeleteSource.Parent) {
      if (caret_delete_policy.type === "propagate_to_child") {
        return CaretDeleteDecision.Child(delete_index);
      } else if (caret_delete_policy.type === "delete_child") {
        return CaretDeleteDecision.DeleteRange({
          start: delete_index,
          end: delete_index + 1,
        });
      }
    } else if (src === CaretDeleteSource.Child || src === undefined) {
      if (caret_delete_policy.type === "propagate_to_child") {
        return CaretDeleteDecision.Child(delete_index);
      } else if (caret_delete_policy.type === "delete_child") {
        return CaretDeleteDecision.DeleteRange({
          start: delete_index,
          end: delete_index + 1,
        });
      }
    }

    return CaretDeleteDecision.Done({});
  };

/** 处理边界策略的辅助函数 */
async function handle_border_strategy(
  strategy: FrontBorderStrategy | BackBorderStrategy,
  params: Parameters<MECompoBehaviorMap[typeof DocCaretDeleteCb]>[0],
  editor: MixEditor,
  tx: Transaction,
  ent_id: string,
  direction: number
) {
  const { ecs } = editor;

  if (strategy.type === "none") {
    return CaretDeleteDecision.Done({});
  } else if (
    strategy.type === "propagate_to_next" ||
    strategy.type === "propagate_to_prev"
  ) {
    return CaretDeleteDecision.Skip;
  } else if (
    strategy.type === "merge_with_next" ||
    strategy.type === "merge_with_prev"
  ) {
    const parent_ent_id = get_parent_ent_id(ecs, ent_id);
    if (!parent_ent_id) return CaretDeleteDecision.Skip;

    const index_in_parent = get_index_of_child_ent(ecs, parent_ent_id, ent_id);
    if (index_in_parent < 0) return CaretDeleteDecision.Skip;

    const target_index = index_in_parent + direction;
    const target_ent_id = get_child_ent_id(ecs, parent_ent_id, target_index);
    if (!target_ent_id) return CaretDeleteDecision.Skip;

    // 确定合并的顺序 (第一个参数是保留的实体)
    const [first_ent, second_ent] =
      direction === CaretDeleteDirection.Prev
        ? [target_ent_id, ent_id] // 向前合并
        : [ent_id, target_ent_id]; // 向后合并

    const result = await execute_merge_ent(editor, tx, first_ent, second_ent);
    if (result) {
      return CaretDeleteDecision.Done(result);
    } else {
      return CaretDeleteDecision.Skip;
    }
  } else if (strategy.type === "custom") {
    return strategy.handler({ ...params, editor });
  }
}

/** 默认的范围删除决策函数。
 *
 * 根据 DocEntTraitsCompo 定义的删除策略进行决策。
 */
export const handle_default_range_delete: MECompoBehaviorMap[typeof DocRangeDeleteCb] =
  async (params) => {
    const { start, end, ent_id, ex_ctx, tx } = params;
    const { ecs, op } = ex_ctx;

    const doc_config = ecs.get_compo(ent_id, DocConfigCompo.type) as
      | DocConfigCompo
      | undefined;
    if (!doc_config) return RangeDeleteDecision.Done({});

    console.log(
      "默认范围删除组件行为",
      ecs.get_ent(ent_id),
      "start:",
      start,
      "end:",
      end,
      "[handle_default_range_delete]"
    );

    if (doc_config.custom_range_delete) {
      return doc_config.custom_range_delete(params);
    }

    const range_delete_policy = doc_config.range_delete_policy.get();
    const border_type = doc_config.border_policy.get();

    if (range_delete_policy.type === "skip")
      return RangeDeleteDecision.Done({});

    if (range_delete_policy.type === "delete_child") {
      await tx.execute(
        new TreeChildrenDeleteOp(op.gen_id(), ent_id, start, end)
      );

      // 检查是否需要删除自身（如果删除后节点为空）
      if (
        border_type === BorderType.Open &&
        get_child_ent_count(ecs, ent_id) === 0
      ) {
        return RangeDeleteDecision.DeleteSelf;
      }

      return RangeDeleteDecision.Done({});
    }

    return RangeDeleteDecision.Done({});
  };
