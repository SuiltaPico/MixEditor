import { MixEditor } from "@mixeditor/core";
import { DocCaret } from "../../selection";

/** 光标导航来源，表示触发导航操作的上下文位置 */
export enum CaretNavigateSource {
  /** 当从父节点进入当前节点时触发（例如从父节点移动到第一个子节点） */
  Parent = "parent",
  /** 当从子节点返回当前节点时触发（例如从子节点移回父节点） */
  Child = "child",
}

/** 光标移动方向，定义在文档结构中的导航方向 */
export enum CaretDirection {
  /** 向文档后部移动（通常对应右方向键或下方向键） */
  Next = 1,
  /** 向文档前部移动（通常对应左方向键或上方向键） */
  Prev = -1,
}

/** 光标导航决策工厂方法，用于创建不同类型的导航决策 */
export const CaretNavigateDecision = {
  /**
   * 跳过当前节点，继续在父级上下文中寻找下一个可导航位置
   * 典型使用场景：当当前节点不允许光标停留时
   */
  Skip: { type: "skip" } satisfies CaretNavigateDecision,

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
  | { type: "skip" }; // 跳过当前节点

/** 光标移动策略上下文。 */
export interface CaretNavigateContext {
  /** 当前导航方向 */
  direction: CaretDirection;
  /** 触发导航的来源上下文 */
  src?: CaretNavigateSource;
  /** 导航起始位置（在节点内容中的偏移量） */
  from: number;
}

/**
 * 从指定光标位置执行导航操作
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
  caret: DocCaret,
  direction: CaretDirection,
  src?: CaretNavigateSource
): Promise<DocCaret | undefined> {
  const ent_ctx = editor.ent;

  let decision: CaretNavigateDecision | undefined;

  decision = await ent_ctx.exec_behavior(
    caret.ent,
    "doc:handle_caret_navigate",
    {
      direction,
      src,
      from: caret.offset,
    }
  );

  if (!decision || decision.type === "skip") {
    // 跳过当前节点，往下一个节点移动
    const ent = caret.ent;
    const parent = ent_ctx.get_domain_ctx("doc", ent)?.parent;

    if (!parent) return;

    const index_in_parent = await ent_ctx.exec_behavior(
      parent,
      "doc:get_index_of_child",
      ent
    )!;

    return await execute_navigate_caret_from_pos(
      editor,
      {
        ent: parent!,
        offset: index_in_parent,
      },
      direction,
      CaretNavigateSource.Child
    );
  } else if (decision.type === "self") {
    return {
      ent: caret.ent,
      offset: decision.pos,
    };
  } else if (decision.type === "child") {
    // 继续访问子节点
    const child = await ent_ctx.exec_behavior(caret.ent, "doc:get_child", {
      index: decision.index,
    });
    // 按照进入方向进行判断。
    return await execute_navigate_caret_from_pos(
      editor,
      // 如果是 next 进入的子节点，则尝试移动到子节点的头部。
      // 如果是 prev 进入的子节点，则尝试移动到子节点的尾部。
      {
        ent: child!,
        offset: direction === CaretDirection.Next ? 0 : Number.MAX_SAFE_INTEGER,
      },
      direction,
      CaretNavigateSource.Parent
    );
  }
}
