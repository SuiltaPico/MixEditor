import {
  create_TreeCollapsedSelection,
  MEEvent,
  MEPipeStageHandler,
  MixEditor,
  TreeCaret,
} from "@mixeditor/core";
import { CaretDirection, execute_navigate_caret_from_pos } from "./executor";

export const DocCaretNavigatePipeId = "doc:caret_navigate" as const;
export interface DocCaretNavigateEvent extends MEEvent {
  type: typeof DocCaretNavigatePipeId;
  direction: CaretDirection;
}

/**
 * 光标导航事件处理管道
 *
 * 处理流程：
 * 1. 等待依赖项就绪
 * 2. 获取当前选区状态：
 *    - 折叠选区：执行完整导航决策链
 *    - 扩展选区：根据方向退化为端点光标
 * 3. 应用新的光标位置
 */
export const caret_navigate_pipe_handler: MEPipeStageHandler<
  DocCaretNavigateEvent
> = async (event, wait_deps) => {
  await wait_deps();
  const editor = event.ex_ctx;

  const selection = editor.selection.get_selection();
  if (!selection) return;

  let caret: TreeCaret | undefined;
  if (selection.type === "tree:collapsed") {
    // 折叠选区光标移动，调用决策链执行器获取光标位置
    try {
      caret = await execute_navigate_caret_from_pos(
        editor,
        selection.caret,
        event.direction
      );
      if (!caret) return;
    } catch (e) {
      // 决策失败，取消移动
      return;
    }
  } else if (selection.type === "tree:extended") {
    // 处理扩展选区的情况：根据方向退化为折叠选区
    // 当向左导航时取选区起点，向右导航时取选区终点
    if (event.direction === CaretDirection.Prev) {
      caret = selection.start;
    } else {
      caret = selection.end;
    }
  }
  if (!caret) return;

  editor.selection.set_selection(create_TreeCollapsedSelection(caret));
};

/**
 * 注册光标导航事件处理管道到编辑器
 * @param editor 要注册管道的编辑器实例
 */
export const register_caret_navigate_pipe = (editor: MixEditor) => {
  editor.pipe.set_pipe(DocCaretNavigatePipeId, [
    {
      id: "doc:default",
      execute: caret_navigate_pipe_handler,
    },
  ]);

  return () => {
    editor.pipe.delete_pipe(DocCaretNavigatePipeId);
  };
};
