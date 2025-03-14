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
} from "../pipe";
import { BorderPolicy, DocEntTraitsCompo } from "../compo/doc_ent_traits";
import { ChildDeletePolicy, SelfDeletePolicy } from "../compo/doc_ent_traits";
/**
 * 处理允许进入子节点时的导航逻辑
 */
function children_enter_navigation(
  traits: DocEntTraitsCompo,
  from: number,
  toPrev: boolean,
  src: CaretNavigateSource | undefined,
  children_count: number
) {
  // 边界策略为不允许越界时的处理
  if (traits.border_policy.get() === BorderPolicy.NoCrossing) {
    const atStart = toPrev && from <= 0;
    const atEnd = !toPrev && from >= children_count;
    if (atStart || atEnd) return CaretNavigateDecision.Skip;
  }

  // 根据导航来源处理不同情况
  switch (src) {
    case CaretNavigateSource.Child: // 来自子元素的导航
      return CaretNavigateDecision.Self(from + (toPrev ? 0 : 1));
    case CaretNavigateSource.Parent: // 来自父元素的导航
      if ((toPrev && from < 0) || (!toPrev && from >= children_count)) {
        return CaretNavigateDecision.Skip;
      }
      return CaretNavigateDecision.Self(from);
    default: // 直接导航（非来自父或子）
      if ((toPrev && from <= 0) || (!toPrev && from >= children_count)) {
        return CaretNavigateDecision.Skip;
      }
      return CaretNavigateDecision.Child(from + (toPrev ? -1 : 0));
  }
}

/**
 * 处理不允许进入子节点时的导航逻辑
 */
function no_children_enter_navigation(
  traits: DocEntTraitsCompo,
  newPos: number,
  toPrev: boolean,
  children_count: number
) {
  const atStart = toPrev ? newPos >= children_count : newPos <= 0;
  const atEnd = toPrev ? newPos < 0 : newPos > children_count;

  switch (traits.border_policy.get()) {
    case BorderPolicy.NoCrossing: // 严格不越界
      if (atEnd) return CaretNavigateDecision.Skip;
      return CaretNavigateDecision.Self(
        Math.max(0, Math.min(newPos, children_count))
      );
    case BorderPolicy.Bordered: // 有边界但允许循环
      if (atStart)
        return CaretNavigateDecision.Self(toPrev ? children_count - 1 : 0);
      if (atEnd) return CaretNavigateDecision.Skip;
      return CaretNavigateDecision.Self(newPos);
    case BorderPolicy.None: // 无边界限制
      return CaretNavigateDecision.Self(newPos);
  }
}

/**
 * 默认的光标导航处理逻辑。
 *
 * 根据 DocEntTraitsCompo 定义的边界策略和导航逻辑进行处理。
 */
export const handle_default_caret_navigate: MECompoBehaviorMap[typeof DocCaretNavigateCb] =
  async (params) => {
    let { from, direction, src, ex_ctx, ent_id } = params;

    // 获取实体组件系统上下文
    const ecs = ex_ctx.ecs;

    // 获取当前实体的文档特性组件
    const traits = ecs.get_compo(ent_id, DocEntTraitsCompo.type) as
      | DocEntTraitsCompo
      | undefined;
    if (!traits) return CaretNavigateDecision.Skip; // 如果没有特性组件则跳过

    // 优先使用自定义导航逻辑（如果存在）
    if (traits.custom_caret_navigate) {
      return traits.custom_caret_navigate(params);
    }

    // 获取实际子组件信息
    const actual_child_compo = get_actual_child_compo(ecs, ent_id);
    const children_count = (actual_child_compo as IChildCompo).count();
    const toPrev = direction === CaretDirection.Prev;

    // 根据是否允许进入子节点分发处理逻辑
    return traits.can_children_enter.get()
      ? children_enter_navigation(traits, from, toPrev, src, children_count)
      : no_children_enter_navigation(
          traits,
          from + direction,
          toPrev,
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
    self_delete_policy: traits.self_delete_from_caret_policy.get(),
    child_delete_policy: traits.child_delete_from_caret_policy.get(),
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
