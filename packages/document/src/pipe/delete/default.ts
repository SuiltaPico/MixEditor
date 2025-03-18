import {
  create_TreeCollapsedSelection,
  get_actual_child_compo,
  IChildCompo,
  MECompoBehaviorMap,
  MixEditor,
  Transaction,
  TreeCollapsedSelectionType,
  TreeRangeDeleteOp,
} from "@mixeditor/core";
import {
  ChildDeletePolicy,
  DocEntTraitsCompo,
  SelfDeletePolicy,
} from "../../compo";
import {
  CaretDeleteDecision,
  CaretDeleteDirection,
  DocCaretDeleteCb,
  DocRangeDeleteCb,
  RangeDeleteDecision,
} from ".";
import {
  CaretDirection,
  execute_navigate_caret_from_pos,
} from "../caret_navigate";

/**
 * 处理自身删除逻辑
 */
async function handle_self_deletion(
  self_delete_policy: SelfDeletePolicy,
  children_count: number
) {
  switch (self_delete_policy) {
    case SelfDeletePolicy.Never:
      return CaretDeleteDecision.Skip;
    case SelfDeletePolicy.WhenEmpty:
      return children_count === 0
        ? CaretDeleteDecision.DeleteSelf
        : CaretDeleteDecision.Skip;
    case SelfDeletePolicy.Normal:
      return CaretDeleteDecision.DeleteSelf;
  }
}

/**
 * 处理子元素范围删除操作
 */
async function delete_child_range(
  ex_ctx: MixEditor,
  ent_id: string,
  from: number,
  to_prev: boolean,
  tx: Transaction
) {
  const { op } = ex_ctx;
  await tx.execute(
    new TreeRangeDeleteOp(
      op.gen_id(),
      ent_id,
      to_prev ? from - 1 : from,
      to_prev ? from - 1 : from
    )
  );
  const new_selection = await execute_navigate_caret_from_pos(
    ex_ctx,
    {
      ent_id,
      offset: to_prev ? from - 1 : from,
    },
    CaretDirection.None 
  );
  if (!new_selection) return CaretDeleteDecision.Done({});
  return CaretDeleteDecision.Done({
    selected: create_TreeCollapsedSelection(new_selection),
  });
}

/**
 * 处理子元素删除逻辑
 */
function handle_child_deletion(
  child_delete_policy: ChildDeletePolicy,
  target_idx: number,
  ex_ctx: MixEditor,
  ent_id: string,
  from: number,
  to_prev: boolean,
  tx: Transaction
) {
  switch (child_delete_policy) {
    case ChildDeletePolicy.Propagate:
      return CaretDeleteDecision.Child(target_idx);
    case ChildDeletePolicy.Absorb:
      return delete_child_range(ex_ctx, ent_id, from, to_prev, tx);
  }
}

/**
 * 获取策略和子元素数量
 */
function get_policies_and_counts(
  ecs: MixEditor["ecs"],
  ent_id: string,
  traits: DocEntTraitsCompo
) {
  const actual_child_compo = get_actual_child_compo(ecs, ent_id);
  return {
    children_count: (actual_child_compo as IChildCompo).count(),
    self_delete_policy: traits.self_delete_policy.get(),
    child_delete_policy: traits.child_delete_policy.get(),
  };
}

/**
 * 默认的光标删除处理逻辑。
 *
 * 根据 DocEntTraitsCompo 定义的删除策略进行处理。
 */
export const handle_default_caret_delete: MECompoBehaviorMap[typeof DocCaretDeleteCb] =
  async (params) => {
    const { from, direction, ent_id, ex_ctx, tx } = params;
    const ecs = ex_ctx.ecs;

    const traits = ecs.get_compo(ent_id, DocEntTraitsCompo.type) as
      | DocEntTraitsCompo
      | undefined;
    if (!traits) return CaretDeleteDecision.Skip;

    if (traits.custom_caret_delete) {
      return traits.custom_caret_delete(params);
    }

    const { children_count, self_delete_policy, child_delete_policy } =
      get_policies_and_counts(ecs, ent_id, traits);
    const to_prev = direction === CaretDeleteDirection.Prev;

    // 处理边界删除（自身删除）
    if ((to_prev && from <= 0) || (!to_prev && from >= children_count)) {
      return handle_self_deletion(self_delete_policy, children_count);
    }

    // 处理子元素删除
    if ((to_prev && from > 0) || (!to_prev && from < children_count)) {
      const target_idx = from + (to_prev ? -1 : 0);
      return handle_child_deletion(
        child_delete_policy,
        target_idx,
        ex_ctx,
        ent_id,
        from,
        to_prev,
        tx
      );
    }

    return CaretDeleteDecision.Skip;
  };

/**
 * 默认的范围删除处理逻辑。
 *
 * 根据 DocEntTraitsCompo 定义的删除策略进行处理。
 */
export const handle_default_range_delete: MECompoBehaviorMap[typeof DocRangeDeleteCb] =
  async (params) => {
    const { start, end, ent_id, ex_ctx, tx } = params;
    const { ecs, op } = ex_ctx;

    const traits = ecs.get_compo(ent_id, DocEntTraitsCompo.type) as
      | DocEntTraitsCompo
      | undefined;
    if (!traits) return RangeDeleteDecision.DeleteSelf;

    const { children_count } = get_policies_and_counts(ecs, ent_id, traits);

    if (start <= 0 && end >= children_count) {
      return RangeDeleteDecision.DeleteSelf;
    } else {
      const start_idx = start <= 0 ? 0 : start;
      const end_idx = end >= children_count ? children_count - 1 : end;
      await tx.execute(
        new TreeRangeDeleteOp(op.gen_id(), ent_id, start_idx, end_idx)
      );
      return RangeDeleteDecision.Done({});
    }
  };
