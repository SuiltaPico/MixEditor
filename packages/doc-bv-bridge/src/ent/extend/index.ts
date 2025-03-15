import { MixEditor } from "@mixeditor/core";
import { register_ParagraphEnt_extend } from "./paragraph";
import { register_TextEnt_extend } from "./text";

export * from "./paragraph";
export * from "./text";

export function register_ent_extend(editor: MixEditor) {
  register_TextEnt_extend(editor);
  register_ParagraphEnt_extend(editor);
}
