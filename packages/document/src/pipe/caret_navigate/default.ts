import {
  IChildCompo,
  MECompoBehaviorMap
} from "@mixeditor/core";
import { BorderPolicy, DocEntTraitsCompo } from "../../compo/doc_ent_traits";
import {
  CaretDirection,
  CaretNavigateDecision,
  CaretNavigateSource,
  DocCaretNavigateCb
} from "../../pipe";

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
