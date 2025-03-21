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
    const { from, direction, ent_id, ex_ctx: editor, tx } = params;
    const { ecs, op } = editor;

    const doc_config = ecs.get_compo(ent_id, DocConfigCompo.type) as
      | DocConfigCompo
      | undefined;
    if (!doc_config) return CaretDeleteDecision.Done({});

    console.log(
      "[handle_default_caret_delete]",
      params,
      ecs.get_ent(ent_id),
      doc_config
    );

    // 如果有自定义删除处理函数，优先使用
    if (doc_config.custom_caret_delete)
      return doc_config.custom_caret_delete(params);

    const { caret_delete_policy, front_border_strategy, back_border_strategy } =
      doc_config;
    const policy = caret_delete_policy.get();

    // 根据删除策略进行处理
    if (policy.type === "skip") return CaretDeleteDecision.Done({});

    if (policy.type === "propagate_to_child")
      return CaretDeleteDecision.Child(
        direction === CaretDeleteDirection.Prev ? from - 1 : from
      );

    if (policy.type === "delete_child") {
      const border_type = doc_config.border_policy.get();
      const child_count = get_child_ent_count(ecs, ent_id);
      const min_index = border_type === BorderType.Closed ? 0 : 1;
      const max_index =
        border_type === BorderType.Closed ? child_count : child_count - 1;

      // 处理边界情况
      if (border_type === BorderType.Closed) {
        // 前向删除且在文档开头
        if (direction === CaretDeleteDirection.Prev && from <= min_index) {
          return handle_border_strategy(
            front_border_strategy.get(),
            params,
            editor,
            tx,
            ent_id,
            CaretDeleteDirection.Prev
          );
        }

        // 后向删除且在文档末尾
        if (direction === CaretDeleteDirection.Next && from >= max_index) {
          return handle_border_strategy(
            back_border_strategy.get(),
            params,
            editor,
            tx,
            ent_id,
            CaretDeleteDirection.Next
          );
        }
      }

      let delete_index = from;
      if (direction === CaretDeleteDirection.Prev) delete_index--;
      if (delete_index < 0) delete_index = min_index;
      else if (delete_index > max_index) delete_index = max_index;

      // 实际执行删除子实体操作
      await tx.execute(
        new TreeChildrenDeleteOp(
          op.gen_id(),
          ent_id,
          delete_index,
          delete_index
        )
      );

      // 检查是否需要删除自身（如果删除后节点为空）
      if (
        border_type === BorderType.Open &&
        get_child_ent_count(ecs, ent_id) === 0
      ) {
        return CaretDeleteDecision.DeleteSelf;
      }

      const new_selection = await execute_navigate_caret_from_pos(
        editor,
        { ent_id, offset: delete_index },
        CaretDirection.None
      );

      return CaretDeleteDecision.Done({
        selected: new_selection
          ? create_TreeCollapsedSelection(new_selection)
          : undefined,
      });
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
  }

  if (
    strategy.type === "propagate_to_next" ||
    strategy.type === "propagate_to_prev"
  ) {
    return CaretDeleteDecision.Skip;
  }

  if (
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

    const success = await execute_merge_ent(editor, tx, first_ent, second_ent);
    return success ? CaretDeleteDecision.Done({}) : CaretDeleteDecision.Skip;
  }

  if (strategy.type === "custom") {
    return strategy.handler({ ...params, editor });
  }

  return CaretDeleteDecision.Skip;
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
      "[handle_default_range_delete]",
      params,
      doc_config,
      ecs.get_ent(ent_id)?.type
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

      const new_selection = await execute_navigate_caret_from_pos(
        ex_ctx,
        { ent_id, offset: start },
        CaretDirection.None
      );

      const decision = new_selection
        ? RangeDeleteDecision.Done({
            selection: create_TreeCollapsedSelection(new_selection),
          })
        : RangeDeleteDecision.Done({});

      // 检查是否需要删除自身（如果删除后节点为空）
      if (
        border_type === BorderType.Open &&
        get_child_ent_count(ecs, ent_id) === 0
      ) {
        return RangeDeleteDecision.DeleteSelf;
      }

      return decision;
    }

    return RangeDeleteDecision.Done({});
  };
