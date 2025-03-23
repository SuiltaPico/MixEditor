import { MixEditor } from "@mixeditor/core";
import {
  DocCaretNavigateCbMapExtend,
  DocCaretNavigateEvent,
  DocCaretNavigatePipeId,
  register_caret_navigate_pipe,
  register_DocCaretNavigateCb,
} from "./caret_navigate";
import {
  DirectedDeleteEvent,
  DocDeleteCbMapExtend,
  DocDirectedDeletePipeId,
  register_directed_delete_pipe,
  register_DocCaretDeleteCb,
} from "./delete";
import { DocInsertCbMapExtend } from "./insert";
import { DocMergeCbMapExtend, register_DocMergeCb } from "./merge";

export * from "./caret_navigate";
export * from "./delete";
export * from "./insert";
export * from "./merge";


export interface DocCompoBehaviorMapExtend
  extends DocCaretNavigateCbMapExtend,
    DocDeleteCbMapExtend,
    DocMergeCbMapExtend,
    DocInsertCbMapExtend {}

export interface DocPipeEventMapExtend {
  [DocCaretNavigatePipeId]: DocCaretNavigateEvent;
  [DocDirectedDeletePipeId]: DirectedDeleteEvent;
}

export const register_pipes_and_compo_behaviors = (editor: MixEditor) => {
  const disposers = [
    register_caret_navigate_pipe(editor),
    register_directed_delete_pipe(editor),
    register_DocCaretDeleteCb(editor),
    register_DocCaretNavigateCb(editor),
    register_DocMergeCb(editor),
  ];

  return () => {
    disposers.forEach((d) => d?.());
  };
};
