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
  type: typeof DocDirectedDeletePipeId;
  /** 删除方向。 */
  direction: CaretDeleteDirection;
  /** 新的选区。 */
  new_selection: MESelection;
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

  let result;
  if (selection.type === TreeCollapsedSelectionType) {
    // 处理光标位置删除（如按退格键/删除键）
    try {
      const tx = new Transaction(editor.op, editor.op.executor);
      result = await execute_caret_deletion(
        editor,
        tx,
        { ent_id: selection.caret.ent_id, offset: selection.caret.offset },
        event.direction
      );
      await tx.commit();
      if (!result) return; // 无有效操作时提前返回
    } catch (e) {
      // 删除操作失败时回滚事务
      return;
    }
  } else if (selection.type === TreeExtendedSelectionType) {
    // 处理选中区域删除（如选中文本后按删除键）
    const tx = new Transaction(editor.op, editor.op.executor);
    result = {
      operation: await execute_range_deletion(
        editor,
        tx,
        { ent_id: selection.start.ent_id, offset: selection.start.offset },
        { ent_id: selection.end.ent_id, offset: selection.end.offset }
      ),
    };
    await tx.commit();
  }

  // 更新删除后的光标位置
  if (result?.selected) {
    editor.selection.set_selection(result.selected);
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
