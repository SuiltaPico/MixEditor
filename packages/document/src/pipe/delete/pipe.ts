import {
  IPipeEvent,
  IPipeStage,
  IPipeStageHandler,
  MEEvent,
  MESelection,
  MixEditor,
  Transaction,
  TreeCollapsedSelectionType,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import { CaretDeleteDirection, execute_caret_deletion } from "./caret_delete";
import { execute_range_deletion } from "./range_delete";

export const DocDirectedDeletePipeId = "doc:delete_directed" as const;

/** 带方向删除事件。 */
export interface DirectedDeleteEvent extends MEEvent {
  pipe_id: typeof DocDirectedDeletePipeId;
  direction: CaretDeleteDirection;
  new_selection?: MESelection;
}

/**
 * 处理定向删除事件的管道处理器
 * 主要功能：
 * 1. 处理光标删除（单个位置删除）
 * 2. 处理范围删除（选中区域删除）
 */
export const directed_delete_pipe_handler: IPipeStageHandler<
  DirectedDeleteEvent,
  MixEditor
> = async (event, wait_deps) => {
  await wait_deps();
  const editor = event.ex_ctx;

  const selection = editor.selection.get_selection();
  if (!selection) return;

  const tx = new Transaction(editor.op, editor.op.executor);

  let result;
  if (selection.type === TreeCollapsedSelectionType) {
    // 处理光标位置删除（如按退格键/删除键）
    result = await execute_caret_deletion(
      editor,
      tx,
      selection.caret,
      event.direction
    );
  } else if (selection.type === TreeExtendedSelectionType) {
    result = await execute_range_deletion(
      editor,
      tx,
      selection.start,
      selection.end
    );
  }

  await tx.commit();

  // 更新删除后的光标位置
  if (result?.selection) {
    editor.selection.set_selection(result.selection);
  }
};

/**
 * 注册定向删除管道到编辑器实例
 * @param editor 需要注册管道的编辑器实例
 *
 * 将删除处理逻辑接入编辑器的事件管道系统
 */
export const register_directed_delete_pipe = (editor: MixEditor) => {
  editor.pipe.set_pipe(DocDirectedDeletePipeId, [
    {
      id: "doc",
      execute: directed_delete_pipe_handler,
    } as IPipeStage<IPipeEvent<any>, MixEditor>,
  ]);

  return () => {
    editor.pipe.delete_pipe(DocDirectedDeletePipeId);
  };
};
