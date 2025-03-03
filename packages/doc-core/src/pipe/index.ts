import { MixEditor } from "@mixeditor/core";
import {
  CaretNavigateEvent,
  register_caret_navigate_pipe,
} from "./caret_navigate";
import { DeleteRangeDecision } from "./delete/delete_range";

export interface PipeEventMapExtend {
  "doc:caret_navigate": CaretNavigateEvent;
}

export const register_pipes = (editor: MixEditor) => {
  register_caret_navigate_pipe(editor);
};
