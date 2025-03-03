import { MixEditor } from "@mixeditor/core";
import {
  CaretNavigateEvent,
  register_caret_navigate_pipe,
} from "./caret_navigate";

export * from "./caret_navigate";
export * from "./delete/";
export * from "./merge_ent";

export interface PipeEventMapExtend {
  "doc:caret_navigate": CaretNavigateEvent;
}

export const register_pipes = (editor: MixEditor) => {
  register_caret_navigate_pipe(editor);
};
