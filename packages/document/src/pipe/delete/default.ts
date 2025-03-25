import { clamp } from "@mixeditor/common";
import {
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  get_parent_ent_id,
  MECompoBehaviorMap,
  MixEditor,
  Transaction,
  TreeDeleteChildrenOp,
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
import { execute_cross_parent_merge_ent } from "../merge";

/** 默认的光标删除处理逻辑。
 *
 * 根据 `DocConfigCompo` 定义的删除策略进行处理。
 */
export const handle_default_caret_delete: MECompoBehaviorMap[typeof DocCaretDeleteCb] =
  async (params) => {
    const { from, direction, ent_id, ex_ctx: editor, tx } = params;
    const { ecs } = editor;

    // 获取文档配置
    const doc_config = ecs.get_compo(ent_id, DocConfigCompo.type) as
      | DocConfigCompo
      | undefined;
    if (!doc_config) return CaretDeleteDecision.Done({});

    // 若存在自定义处理则优先使用
    if (doc_config.custom_caret_delete)
      return doc_config.custom_caret_delete(params);

    const caret_delete_policy = doc_config.caret_delete_policy.get();
    const front_border_strategy = doc_config.front_border_strategy.get();
    const back_border_strategy = doc_config.back_border_strategy.get();
    const child_count = get_child_ent_count(ecs, ent_id);

    // 根据删除策略进行处理
    if (caret_delete_policy.type === "skip")
      return CaretDeleteDecision.Done({});

    // 若无子实体，则删除自身
    if (child_count === 0) return CaretDeleteDecision.DeleteSelf;

    // 将位置索引映射到要删除的实体索引
    let delete_ent_index = from + (CaretDeleteDirection.Prev ? -1 : 0);

    // 处理边界情况，即开头前向/结尾后向删除
    if (
      (direction === CaretDeleteDirection.Prev && delete_ent_index <= -1) ||
      (direction === CaretDeleteDirection.Next &&
        delete_ent_index >= child_count)
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

    // 确保索引在有效范围内
    delete_ent_index = clamp(delete_ent_index, 0, child_count - 1);

    // 根据删除策略进行处理
    if (caret_delete_policy.type === "propagate_to_child")
      return CaretDeleteDecision.Child(delete_ent_index);
    else if (caret_delete_policy.type === "delete_child")
      return CaretDeleteDecision.DeleteRange({
        start: delete_ent_index,
        end: delete_ent_index + 1,
      });

    // 若无其他策略，则算完成处理
    return CaretDeleteDecision.Done({});
  };

/** 处理边界策略的辅助函数 */
async function handle_border_strategy(
  border_strategy: FrontBorderStrategy | BackBorderStrategy,
  params: Parameters<MECompoBehaviorMap[typeof DocCaretDeleteCb]>[0],
  editor: MixEditor,
  tx: Transaction,
  ent_id: string,
  direction: number
) {
  const { ecs } = editor;

  if (border_strategy.type === "none")
    // 若无策略，则算完成处理
    return CaretDeleteDecision.Done({});
  else if (
    border_strategy.type === "propagate_to_next" ||
    border_strategy.type === "propagate_to_prev"
  )
    // 若策略为传播到下一个/上一个实体，则跳过
    return CaretDeleteDecision.Skip;
  else if (
    border_strategy.type === "merge_with_next" ||
    border_strategy.type === "merge_with_prev"
  ) {
    // 若策略为合并到下一个/上一个实体，则尝试进行合并，如果合并失败则跳过
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

    const result = await execute_cross_parent_merge_ent(
      editor,
      tx,
      first_ent,
      get_child_ent_count(ecs, first_ent),
      second_ent
    );
    if (result) return CaretDeleteDecision.Done(result);
    else {
      // 若合并失败，则跳过
      return CaretDeleteDecision.Skip;
    }
  } else if (border_strategy.type === "custom") {
    // 若策略为自定义，则调用自定义策略
    return border_strategy.handler({ ...params, editor });
  }
}

/** 默认的范围删除处理逻辑。
 *
 * 根据 `DocConfigCompo` 定义的删除策略进行决策。
 */
export const handle_default_range_delete: MECompoBehaviorMap[typeof DocRangeDeleteCb] =
  async (params) => {
    const { start, end, ent_id, ex_ctx, tx } = params;
    const { ecs, op } = ex_ctx;

    // 获取文档配置
    const doc_config = ecs.get_compo(ent_id, DocConfigCompo.type) as
      | DocConfigCompo
      | undefined;
    if (!doc_config) return RangeDeleteDecision.Done({});

    // 若存在自定义处理则优先使用
    if (doc_config.custom_range_delete)
      return doc_config.custom_range_delete(params);

    // 获取范围删除策略和边界策略
    const range_delete_policy = doc_config.range_delete_policy.get();
    const border_type = doc_config.border_policy.get();

    // 处理删除子实体策略
    if (range_delete_policy.type === "delete_child") {
      // 执行子实体删除操作
      await tx.execute(
        new TreeDeleteChildrenOp(op.gen_id(), ent_id, start, end)
      );

      // 检查是否需要删除自身（当边框策略为开放且子实体为空时）
      if (
        border_type === BorderType.Open &&
        get_child_ent_count(ecs, ent_id) === 0
      ) {
        return RangeDeleteDecision.DeleteSelf;
      }
    }

    // 默认返回处理完成
    return RangeDeleteDecision.Done({});
  };
