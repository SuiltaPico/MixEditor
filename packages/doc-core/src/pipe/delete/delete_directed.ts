import { IPipeEvent, IPipeStage, IPipeStageHandler, MEEvent, MixEditor, Transaction } from "@mixeditor/core";
import { DeleteFromCaretDirection, execute_delete_from_caret } from "./delete_from_caret";
import { DocSelection } from "../../selection";
import { execute_delete_range } from "./delete_range";

export interface DeleteDirectedEvent extends MEEvent {
  type: "doc:delete_directed";
  direction: DeleteFromCaretDirection;
  new_selection: DocSelection;
}

export const delete_directed_pipe_handler: IPipeStageHandler<
  DeleteDirectedEvent,
  MixEditor
> = async (event, wait_deps) => {
  await wait_deps();
  const editor = event.ex_ctx;

  const selected = editor.selection.get_selected();
  if (!selected) return;

  let result;
  if (selected.type === "doc:collapsed") {
    // 折叠选区执行删除操作
    try {
      const tx = new Transaction(editor.op, editor.op.executor);
      result = await execute_delete_from_caret(
        editor,
        tx,
        {
          ent: selected.caret.ent,
          offset: selected.caret.offset,
        },
        event.direction
      );
      await tx.commit();
      if (!result) return;
    } catch (e) {
      // 决策失败，取消删除
      return;
    }
  } else if (selected.type === "doc:extended") {
    // 扩展选区执行删除范围操作
    const tx = new Transaction(editor.op, editor.op.executor);
    result = {
      operation: await execute_delete_range(
        editor,
        tx,
        {
          ent: selected.start.ent,
          offset: selected.start.offset,
        },
        {
          ent: selected.end.ent,
          offset: selected.end.offset,
        }
      ),
    };
    await tx.commit();
  }

  if (result?.selected) {
    editor.selection.set_selected(result.selected);
  }
};

export const register_delete_directed_pipe = (editor: MixEditor) => {
  editor.pipe.set_pipe("doc:delete_directed", [
    {
      id: "handle_delete_directed",
      execute: delete_directed_pipe_handler,
    } as IPipeStage<IPipeEvent<any>, MixEditor>,
  ]);
};
