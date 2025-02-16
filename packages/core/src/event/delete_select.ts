import { NavigateDirection } from "../common/navigate";
import { Operation } from "../operation/Operation";
import {
  execute_delete_from_point,
} from "../resp_chain/delete_from_point";
import { execute_delete_range } from "../resp_chain/delete_range";
import { Selected } from "../selection";
import { EventHandler, MixEditorEventManagerContext } from "./event";

export interface DeleteSelectedEvent {
  type: "delete_selected";
  direction: NavigateDirection;
}

export function create_DeleteSelectedEvent(
  direction: NavigateDirection
): DeleteSelectedEvent {
  return {
    type: "delete_selected",
    direction,
  };
}

export async function handle_delete_selected(
  params: Parameters<
    EventHandler<DeleteSelectedEvent, MixEditorEventManagerContext>
  >[0]
) {
  const { wait_dependencies, event, manager_context } = params;
  await wait_dependencies();

  const { editor } = manager_context;
  const { selection, history_manager, node_manager } = editor;

  const selected = selection.get_selected();
  if (!selected) return;

  let operation: Operation | undefined;
  let new_selected: Selected | undefined;
  if (selected.type === "collapsed") {
    const result = await execute_delete_from_point(
      editor,
      selected.start,
      event.direction
    );
    if (!result) return;

    operation = result.operation;
    new_selected = result.selected;
  } else if (selected.type === "extended") {
    operation = await execute_delete_range(
      editor,
      selected.start,
      selected.end
    );
  }

  if (operation) {
    await history_manager.execute(operation);
  }

  if (new_selected) {
    selection.set_selected(new_selected);
  }
}
