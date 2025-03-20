import { MixEditor } from "@mixeditor/core";
import {
  DocCaretNavigateCbMapExtend,
  DocCaretNavigateEvent,
  DocCaretNavigatePipeId,
  register_caret_navigate_pipe,
  register_DocCaretNavigate,
} from "./caret_navigate";
import {
  DirectedDeleteEvent,
  register_directed_delete_pipe,
  DocDeleteCbMapExtend,
  DocDirectedDeletePipeId,
  register_DocCaretDelete,
} from "./delete";
import { register_DocMerge, DocMergeCbMapExtend } from "./merge";

export * from "./caret_navigate";
export * from "./delete";
export * from "./merge";

export interface DocCompoBehaviorMapExtend
  extends DocCaretNavigateCbMapExtend,
    DocDeleteCbMapExtend,
    DocMergeCbMapExtend {}

export interface DocPipeEventMapExtend {
  [DocCaretNavigatePipeId]: DocCaretNavigateEvent;
  [DocDirectedDeletePipeId]: DirectedDeleteEvent;
}

export const register_pipes_and_compo_behaviors = (editor: MixEditor) => {
  const disposers = [
    register_caret_navigate_pipe(editor),
    register_directed_delete_pipe(editor),
    register_DocCaretDelete(editor),
    register_DocCaretNavigate(editor),
    register_DocMerge(editor),
  ];

  return () => {
    disposers.forEach((d) => d?.());
  };
};
