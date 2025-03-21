import { MixEditor } from "@mixeditor/core";
import { register_ParagraphEnt_extend } from "./paragraph";
import { register_TextEnt_extend } from "./text";
import { register_CodeBlockEnt_extend } from "./code_block";

export * from "./paragraph";
export * from "./text";
export * from "./code_block";

export function register_ent_extend(editor: MixEditor) {
  register_TextEnt_extend(editor);
  register_ParagraphEnt_extend(editor);
  register_CodeBlockEnt_extend(editor);
}
