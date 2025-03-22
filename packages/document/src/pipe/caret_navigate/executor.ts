import {
  get_actual_child_compo,
  get_child_ent_id,
  get_index_in_parent_ent,
  get_parent_ent_id,
  MixEditor,
  TreeCaret,
} from "@mixeditor/core";
import { DocCaretNavigateCb } from ".";

/** 光标导航来源，表示触发导航操作的上下文位置 */
export enum CaretNavigateSource {
  /** 当从父节点进入当前节点时触发（例如从父节点移动到第一个子节点） */
  Parent = "parent",
  /** 当从子节点返回当前节点时触发（例如从子节点移回父节点） */
  Child = "child",
}

/** 光标移动方向，定义在文档结构中的导航方向 */
export enum CaretDirection {
  /** 向文档后部移动（通常对应右方向键） */
  Next = 1,
  /** 向文档前部移动（通常对应左方向键） */
  Prev = -1,
  /** 无方向 */
  None = 0,
}

/** 光标导航决策工厂方法，用于创建不同类型的导航决策 */
export const CaretNavigateDecision = {
  /**
   * 跳过当前节点，继续在父级上下文中寻找下一个可导航位置
   * 典型使用场景：当当前节点不允许光标停留时
   */
  Skip: (params: { direction: CaretDirection }) => {
    const result = params as CaretNavigateDecision & { type: "skip" };
    result.type = "skip";
    return result satisfies CaretNavigateDecision & { type: "skip" };
  },

  /**
   * 停留在当前节点，并指定具体的光标位置
   * @param pos 光标在节点内容中的偏移位置（默认为0）
   */
  Self: (pos: number = 0) =>
    ({ type: "self", pos } satisfies CaretNavigateDecision),

  /**
   * 进入指定索引的子节点进行导航
   * @param index 要进入的子节点索引（默认为第一个子节点）
   */
  Child: (index: number = 0) =>
    ({
      type: "child",
      index,
    } satisfies CaretNavigateDecision),
};

/** 光标移动决策。 */
export type CaretNavigateDecision =
  | { type: "self"; pos: number } // 进入当前节点
  | { type: "child"; index: number } // 进入子节点
  | { type: "skip"; direction: CaretDirection }; // 跳过当前节点

/** 光标移动策略上下文。 */
export interface CaretNavigateContext {
  /** 当前导航实体 */
  ent_id: string;
  /** 当前导航方向 */
  direction: CaretDirection;
  /** 触发导航的来源上下文 */
  src?: CaretNavigateSource;
  /** 导航起始位置（在节点内容中的偏移量） */
  from: number;
}

/**
 * 从指定光标位置执行导航操作。
 * @param editor 编辑器实例
 * @param caret 当前光标位置
 * @param direction 导航方向
 * @param src 导航来源上下文
 * @returns 新的光标位置，如果导航不可行则返回 undefined
 *
 * 算法流程：
 * 1. 请求当前实体处理导航决策
 * 2. 根据返回的决策类型处理：
 *    - Skip: 回溯到父节点继续导航
 *    - Self: 停留在当前节点并调整位置
 *    - Child: 进入子节点继续导航
 * 3. 递归处理直到找到有效位置或遍历完所有可能路径
 */
export async function execute_navigate_caret_from_pos(
  editor: MixEditor,
  caret: TreeCaret,
  direction: CaretDirection,
  src?: CaretNavigateSource
): Promise<TreeCaret | undefined> {
  const ecs = editor.ecs;
  const caret_ent_id = caret.ent_id;

  const actual_child_compo = get_actual_child_compo(ecs, caret_ent_id);
  if (!actual_child_compo) return;

  console.log(
    "从光标导航 等待决策",
    ecs.get_ent(caret_ent_id),
    "direction:",
    direction,
    "src:",
    src,
    "offset:",
    caret.offset,
    "[execute_navigate_caret_from_pos]"
  );

  const decision = await ecs.run_compo_behavior(
    actual_child_compo,
    DocCaretNavigateCb,
    {
      ent_id: caret_ent_id,
      direction,
      src,
      from: caret.offset,
    }
  );

  console.log(
    "从光标导航 获得决策",
    ecs.get_ent(caret_ent_id),
    "decision:",
    decision
  );

  if (!decision || decision.type === "skip") {
    // 跳过当前节点，往下一个节点移动
    const parent_id = get_parent_ent_id(ecs, caret_ent_id);
    if (!parent_id) return;

    const index_in_parent = get_index_in_parent_ent(ecs, caret_ent_id);

    return await execute_navigate_caret_from_pos(
      editor,
      {
        ent_id: parent_id,
        offset: index_in_parent,
      },
      decision?.direction ?? direction,
      CaretNavigateSource.Child
    );
  } else if (decision.type === "self") {
    return {
      ent_id: caret_ent_id,
      offset: decision.pos,
    };
  } else if (decision.type === "child") {
    // 继续访问子节点
    const child_ent_id = get_child_ent_id(ecs, caret_ent_id, decision.index);
    if (!child_ent_id) return;

    return await execute_navigate_caret_from_pos(
      editor,
      {
        ent_id: child_ent_id!,
        offset: direction === CaretDirection.Next ? 0 : Number.MAX_SAFE_INTEGER,
      },
      direction,
      CaretNavigateSource.Parent
    );
  }
}
