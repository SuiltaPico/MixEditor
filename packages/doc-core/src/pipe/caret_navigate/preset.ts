import { MEEntBehaviorMap } from "@mixeditor/core";
import {
  CaretDirection,
  CaretNavigateDecision,
  CaretNavigateSource,
} from "./executor";

/**
 * 处理具有以下特征的实体光标导航：
 * 1. 子节点不可直接进入（如文本节点的字符）
 * 2. 实体本身没有显式边界（到达边界时直接跳转到父级）
 *
 * 典型场景：文本实体导航
 * - 当在文本开头按左方向键：跳转到前一个兄弟节点末尾
 * - 当在文本末尾按右方向键：跳转到下一个兄弟节点开头
 * - 在文本中间移动：在字符间移动
 *
 */
export const handle_non_enterable_children_and_non_boundary_caret_navigate: MEEntBehaviorMap["doc:handle_caret_navigate"] =
  async (params) => {
    let { item: ent, from, direction, ex_ctx: editor } = params;

    // 获取子节点虚拟长度（如文本字符数）
    const children_length =
      (await editor.ent.exec_behavior(ent, "doc:get_length", {})!) ?? 0;

    // 根据移动方向预计算新位置
    from += direction;
    if (from > children_length) {
      from = children_length;
    }
    const to_prev = direction === CaretDirection.Prev;

    // 处理边界情况
    if ((to_prev && from >= children_length) || (!to_prev && from <= 0)) {
      // 到达顺方向的前边界（如文本开头按左键），停留在当前实体但跳转到另一端
      return CaretNavigateDecision.Self(to_prev ? children_length - 1 : 1);
    } else if (
      (to_prev && from <= 0) ||
      (!to_prev && from >= children_length)
    ) {
      // 到达顺方向的后边界（如文本末尾按右键），触发跳过当前实体
      return CaretNavigateDecision.Skip;
    } else {
      // 常规位置移动
      return CaretNavigateDecision.Self(from);
    }
  };

/**
 * 处理可进入子节点的实体光标导航逻辑
 *
 * 适用场景：
 * - 容器型实体（如段落、图片组、表格等）
 * - 具有明确子节点边界的实体
 */
export const handle_enterable_children_caret_navigation: MEEntBehaviorMap["doc:handle_caret_navigate"] =
  async ({ item: ent, from, direction, ex_ctx: editor, src }) => {
    const children_length =
      (await editor.ent.exec_behavior(ent, "doc:get_length", {})!) ?? 0;

    const to_prev = direction === CaretDirection.Prev;

    // 处理边界进入
    if ((to_prev && from > children_length) || (!to_prev && from < 0)) {
      // 如果进入时超出该方向的首边界，则跳转至首边界。
      return CaretNavigateDecision.Self(to_prev ? children_length : 0);
    }

    // 处理不同来源的导航
    switch (src) {
      case CaretNavigateSource.Child:
        // 从子节点跳入，则跳转至指定索引
        return CaretNavigateDecision.Self(
          from + (direction === CaretDirection.Prev ? 0 : 1)
        );

      case CaretNavigateSource.Parent:
        // 从父节点跳入，则跳转至指定索引
        if ((to_prev && from < 0) || (!to_prev && from >= children_length)) {
          // 如果超出该方向的尾边界，则跳过
          return CaretNavigateDecision.Skip;
        }
        return CaretNavigateDecision.Self(from);

      default:
        from += direction === CaretDirection.Prev ? -1 : 0;
        // 从自身索引移动，则跳入子节点
        if ((to_prev && from < 0) || (!to_prev && from >= children_length)) {
          // 如果超出该方向的尾边界，则跳过
          return CaretNavigateDecision.Skip;
        }
        return CaretNavigateDecision.Child(from);
    }
  };
