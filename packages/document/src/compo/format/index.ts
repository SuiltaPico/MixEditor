import { MixEditor } from "@mixeditor/core";
import { register_DocTextBoldCompo } from "./bold";
import { register_DocTextItalicCompo } from "./italic";

export * from "./bold";
export * from "./italic";

export function register_format_compos(editor: MixEditor) {
  register_DocTextBoldCompo(editor);
  register_DocTextItalicCompo(editor);
}
