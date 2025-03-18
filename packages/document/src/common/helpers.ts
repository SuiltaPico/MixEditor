import {
  get_actual_child_compo,
  IChildCompo,
  MECompoBehaviorMap,
  TreeCollapsedSelectionType,
  TreeRangeDeleteOp,
} from "@mixeditor/core";
import {
  CaretDirection,
  CaretNavigateDecision,
  CaretNavigateSource,
  DocCaretNavigateCb,
  CaretDeleteDecision,
  CaretDeleteDirection,
  DocCaretDeleteCb,
  DocRangeDeleteCb,
  RangeDeleteDecision,
} from "../pipe";
import { BorderPolicy, DocEntTraitsCompo } from "../compo/doc_ent_traits";
import { ChildDeletePolicy, SelfDeletePolicy } from "../compo/doc_ent_traits";

/**
 * 处理允许进入子节点时的导航逻辑
 */
function children_enter_navigation(
  traits: DocEntTraitsCompo,
  from: number,
  to_prev: boolean,
  to_next: boolean,
  no_direction: boolean,
  src: CaretNavigateSource | undefined,
  children_count: number
) {
  const border_policy = traits.border_policy.get();
  const can_self_enter = traits.can_self_enter.get();
  let new_pos;

  // 根据导航来源处理不同情况
  if (src === CaretNavigateSource.Child) {
    // 来自子元素的导航
    if (can_self_enter) {
      new_pos = from + (to_next ? 1 : 0);
      const cross_border_in_same_direction_to_prev =
        border_policy === BorderPolicy.Bordered
          ? (to_prev || no_direction) && new_pos < 0
          : (to_prev || no_direction) && new_pos <= 0;
      const cross_border_in_same_direction_to_next =
        border_policy === BorderPolicy.Bordered
          ? (to_next || no_direction) && new_pos > children_count
          : (to_next || no_direction) && new_pos >= children_count;

      if (cross_border_in_same_direction_to_prev)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Prev,
        });
      else if (cross_border_in_same_direction_to_next)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Next,
        });

      return CaretNavigateDecision.Self(new_pos);
    } else {
      new_pos = from + (to_prev ? -1 : 0) + (to_next ? 1 : 0);
      const cross_border_in_same_direction_to_prev = new_pos < 0;
      const cross_border_in_same_direction_to_next =
        new_pos > children_count - 1;

      if (cross_border_in_same_direction_to_prev)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Prev,
        });
      if (cross_border_in_same_direction_to_next)
        return CaretNavigateDecision.Skip({ direction: CaretDirection.Next });

      return CaretNavigateDecision.Child(new_pos);
    }
  } else if (src === CaretNavigateSource.Parent) {
    // 从父节点进入是精确的导航，不受 to_prev 影响
    new_pos = from;
    if (can_self_enter) {
      const cross_border_in_same_direction_to_prev =
        border_policy === BorderPolicy.Bordered
          ? (to_prev || no_direction) && new_pos < 0
          : (to_prev || no_direction) && new_pos <= 0;
      const cross_border_in_same_direction_to_next =
        border_policy === BorderPolicy.Bordered
          ? (to_next || no_direction) && new_pos > children_count
          : (to_next || no_direction) && new_pos >= children_count;

      if (cross_border_in_same_direction_to_prev)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Prev,
        });
      else if (cross_border_in_same_direction_to_next)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Next,
        });

      const cross_border_in_opposite_direction =
        border_policy === BorderPolicy.Bordered
          ? (to_next && new_pos < 0) || (to_prev && new_pos > children_count)
          : (to_next && new_pos <= 0) || (to_prev && new_pos >= children_count);

      if (cross_border_in_opposite_direction) {
        if (border_policy === BorderPolicy.Bordered)
          return CaretNavigateDecision.Self(to_prev ? children_count : 0);

        return CaretNavigateDecision.Self(to_prev ? children_count - 1 : 1);
      }
      return CaretNavigateDecision.Self(new_pos);
    } else {
      new_pos = from;
      const cross_border_in_same_direction_to_prev = new_pos < 0;
      const cross_border_in_same_direction_to_next =
        new_pos > children_count - 1;
      const cross_border_in_opposite_direction =
        (to_next && new_pos < 0) || (to_prev && new_pos > children_count - 1);
      if (cross_border_in_same_direction_to_prev)
        return CaretNavigateDecision.Skip({
          direction: CaretDirection.Prev,
        });
      if (cross_border_in_same_direction_to_next)
        return CaretNavigateDecision.Skip({ direction: CaretDirection.Next });
      if (cross_border_in_opposite_direction) {
        return CaretNavigateDecision.Child(to_prev ? children_count - 1 : 1);
      }
      return CaretNavigateDecision.Child(new_pos);
    }
  } else {
    // 当索引在自身身上时候，自身的跳转。应该直接进入子节点
    new_pos = from + (to_prev ? -1 : 0);
    const cross_border_in_same_direction_to_prev = new_pos < 0;
    const cross_border_in_same_direction_to_next = new_pos > children_count - 1;
    const cross_border_in_opposite_direction =
      (to_next && new_pos < 0) || (to_prev && new_pos > children_count - 1);

    if (cross_border_in_same_direction_to_prev)
      return CaretNavigateDecision.Skip({
        direction: CaretDirection.Prev,
      });
    else if (cross_border_in_same_direction_to_next)
      return CaretNavigateDecision.Skip({ direction: CaretDirection.Next });

    if (cross_border_in_opposite_direction) {
      return CaretNavigateDecision.Child(to_prev ? children_count - 1 : 1);
    }
    return CaretNavigateDecision.Child(new_pos);
  }
}

/**
 * 处理不允许进入子节点时的导航逻辑
 */
function no_children_enter_navigation(
  traits: DocEntTraitsCompo,
  new_pos: number,
  to_prev: boolean,
  to_next: boolean,
  no_direction: boolean,
  children_count: number
) {
  const border_policy = traits.border_policy.get();
  const cross_border_in_same_direction_to_prev =
    border_policy === BorderPolicy.Bordered
      ? (to_prev || no_direction) && new_pos < 0
      : (to_prev || no_direction) && new_pos <= 0;
  const cross_border_in_same_direction_to_next =
    border_policy === BorderPolicy.Bordered
      ? (to_next || no_direction) && new_pos > children_count
      : (to_next || no_direction) && new_pos >= children_count;
  // 如果顺导航方向越界，则跳过
  if (cross_border_in_same_direction_to_prev)
    return CaretNavigateDecision.Skip({
      direction: CaretDirection.Prev,
    });
  else if (cross_border_in_same_direction_to_next)
    return CaretNavigateDecision.Skip({ direction: CaretDirection.Next });

  const cross_border_in_opposite_direction =
    border_policy === BorderPolicy.Bordered
      ? (!to_prev && new_pos < 0) || (to_prev && new_pos > children_count)
      : (!to_prev && new_pos <= 0) || (to_prev && new_pos >= children_count);

  // 如果逆导航方向越界，则跳跃到边界内
  if (cross_border_in_opposite_direction) {
    if (border_policy === BorderPolicy.Bordered) {
      return CaretNavigateDecision.Self(to_prev ? children_count : 0);
    } else {
      return CaretNavigateDecision.Self(to_prev ? children_count - 1 : 1);
    }
  }
  // 否则则正常导航
  return CaretNavigateDecision.Self(new_pos);
}

/**
 * 默认的光标导航处理逻辑。
 *
 * 根据 DocEntTraitsCompo 定义的边界策略和导航逻辑进行处理。
 */
export const handle_default_caret_navigate: MECompoBehaviorMap[typeof DocCaretNavigateCb] =
  async (params) => {
    let {
      from,
      direction,
      src,
      ex_ctx,
      ent_id,
      it: actual_child_compo,
    } = params;

    // 获取实体组件系统上下文
    const ecs = ex_ctx.ecs;

    // 获取当前实体的文档特性组件
    const traits = ecs.get_compo(ent_id, DocEntTraitsCompo.type) as
      | DocEntTraitsCompo
      | undefined;
    if (!traits) return CaretNavigateDecision.Skip({ direction }); // 如果没有特性组件则跳过

    // 优先使用自定义导航逻辑（如果存在）
    if (traits.custom_caret_navigate) {
      return traits.custom_caret_navigate(params);
    }

    // 获取实际子组件信息
    const children_count = (actual_child_compo as IChildCompo).count();
    const to_prev = direction === CaretDirection.Prev;
    const to_next = direction === CaretDirection.Next;
    const no_direction = direction === CaretDirection.None;

    // 根据是否允许进入子节点分发处理逻辑
    return traits.can_children_enter.get()
      ? children_enter_navigation(
          traits,
          from,
          to_prev,
          to_next,
          no_direction,
          src,
          children_count
        )
      : no_children_enter_navigation(
          traits,
          from + direction,
          to_prev,
          to_next,
          no_direction,
          children_count
        );
  };

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
  ex_ctx: any,
  ent_id: string,
  from: number,
  toPrev: boolean
) {
  const { op, tx } = ex_ctx;
  await tx.execute(
    new TreeRangeDeleteOp(
      op.gen_id(),
      ent_id,
      toPrev ? from - 1 : from,
      toPrev ? from : from + 1
    )
  );
  return CaretDeleteDecision.Done({
    selected: {
      type: TreeCollapsedSelectionType,
      caret: {
        ent_id,
        offset: toPrev ? from - 1 : from,
      },
    },
  });
}

/**
 * 处理子元素删除逻辑
 */
function handle_child_deletion(
  child_delete_policy: ChildDeletePolicy,
  target_idx: number,
  ex_ctx: any,
  ent_id: string,
  from: number,
  toPrev: boolean
) {
  switch (child_delete_policy) {
    case ChildDeletePolicy.Propagate:
      return CaretDeleteDecision.Child(target_idx);
    case ChildDeletePolicy.Absorb:
      return delete_child_range(ex_ctx, ent_id, from, toPrev);
  }
}

/**
 * 获取策略和子元素数量
 */
function get_policies_and_counts(
  ecs: any,
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
    const { from, direction, ent_id, ex_ctx } = params;
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
    const toPrev = direction === CaretDeleteDirection.Prev;

    // 处理边界删除（自身删除）
    if ((toPrev && from <= 0) || (!toPrev && from >= children_count)) {
      return handle_self_deletion(self_delete_policy, children_count);
    }

    // 处理子元素删除
    if ((toPrev && from > 0) || (!toPrev && from < children_count)) {
      const target_idx = from + (toPrev ? -1 : 0);
      return handle_child_deletion(
        child_delete_policy,
        target_idx,
        ex_ctx,
        ent_id,
        from,
        toPrev
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
