import { MixEditor } from "@mixeditor/core";
import {
  CaretNavigateEvent,
  DocCaretNavigateCompoBehavior,
  register_caret_navigate_pipe,
} from "./caret_navigate";
import {
  DirectedDeleteEvent,
  register_directed_delete_pipe,
} from "./delete/pipe_handler";

export * from "./caret_navigate";
export * from "./delete";
export * from "./merge_ent";

export interface DocCompoBehaviorMapExtend
  extends DocCaretNavigateCompoBehavior {}

export interface PipeEventMapExtend {
  "doc:caret_navigate": CaretNavigateEvent;
  "doc:directed_delete": DirectedDeleteEvent;
}

export const register_pipes = (editor: MixEditor) => {
  const disposers = [
    register_caret_navigate_pipe(editor),
    register_directed_delete_pipe(editor),
  ];

  return () => {
    disposers.forEach((d) => d());
  };
};
