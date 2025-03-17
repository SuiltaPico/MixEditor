import { MixEditor } from "@mixeditor/core";
import { register_DocTextBoldCompo_extend } from "./bold";
import { register_DocTextItalicCompo_extend } from "./italic";

export * from "./bold";
export * from "./italic";

export function register_compos(editor: MixEditor) {
  register_DocTextBoldCompo_extend(editor);
  register_DocTextItalicCompo_extend(editor);
}
