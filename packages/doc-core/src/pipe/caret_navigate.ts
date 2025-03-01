import { MEEvent, MEPipeStageHandler, MixEditor } from "@mixeditor/core";
import {
  create_CollapsedSelection,
  DocNodeCaret,
  DocSelection,
} from "../selection";

/** 驱使光标移动的来源。 */
export enum CaretNavigateSource {
  /** 父节点。 */
  Parent = "parent",
  /** 子节点。 */
  Child = "child",
}

/** 光标移动方向。 */
export enum CaretDirection {
  /** 向前移动。 */
  Next = 1,
  /** 向后移动。 */
  Prev = -1,
}

/** 光标移动决策。 */
export const CaretNavigateDecision = {
  /** 不接受进入，跳过当前节点。 */
  Skip: { type: "skip" } satisfies CaretNavigateDecision,
  /** 接受进入，并把光标移动到指定位置。 */
  Self: (pos: number = 0) =>
    ({ type: "self", pos } satisfies CaretNavigateDecision),
  /** 接受进入，交给此节点内部的指定节点处理。 */
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
  /** 要移动的方向。 */
  direction: CaretDirection;
  /** 请求移动的来源。 */
  src?: CaretNavigateSource;
  /** 要移动到的位置。 */
  from: number;
}

/** 从光标位置执行光标移动。 */
export async function execute_caret_navigate_from_caret(
  editor: MixEditor,
  caret: DocNodeCaret,
  direction: CaretDirection,
  src?: CaretNavigateSource
): Promise<DocNodeCaret | undefined> {
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

    return await execute_caret_navigate_from_caret(
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
    return await execute_caret_navigate_from_caret(
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

export interface CaretNavigateEvent extends MEEvent {
  type: "doc:caret_navigate";
  direction: CaretDirection;

  new_selection: DocSelection;
}

export const caret_navigate_pipe_handler: MEPipeStageHandler<
  CaretNavigateEvent
> = async (event, wait_deps) => {
  await wait_deps();
  const editor = event.ex_ctx;

  const selected = editor.selection.get_selected();
  if (!selected) return;

  let caret: DocNodeCaret | undefined;
  if (selected.type === "doc:collapsed") {
    // 折叠选区光标移动，调用决策链执行器获取光标位置
    try {
      caret = await execute_caret_navigate_from_caret(
        editor,
        selected.caret,
        event.direction
      );
      if (!caret) return;
    } catch (e) {
      // 决策失败，取消移动
      return;
    }
  } else if (selected.type === "doc:extended") {
    // 扩展选区光标移动，则退化成 collapsed 类型
    if (event.direction === CaretDirection.Prev) {
      caret = selected.start;
    } else {
      caret = selected.end;
    }
  }
  if (!caret) return;

  editor.selection.set_selected(create_CollapsedSelection(caret));
};

export const register_caret_navigate_pipe = (editor: MixEditor) => {
  editor.pipe.set_pipe("doc:caret_navigate", [
    {
      id: "handle_navigate",
      execute: caret_navigate_pipe_handler,
    },
  ]);
};
