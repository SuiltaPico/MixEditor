import { MixEditor } from "@mixeditor/core";
import { register_DocLinkCompo_extend } from "./format/common/link";
import { register_DocTextBoldCompo_extend } from "./format/inline/bold";
import { register_DocCodeInlineCompo_extend } from "./format/inline/code_inline";
import { register_DocHeadingCompo_extend } from "./format/block/heading";
import { register_DocTextItalicCompo_extend } from "./format/inline/italic";

export * from "./format/common/link";
export * from "./format/inline/bold";
export * from "./format/inline/code_inline";
export * from "./format/block/heading";
export * from "./format/inline/italic";


export function register_compos(editor: MixEditor) {
  register_DocTextBoldCompo_extend(editor);
  register_DocTextItalicCompo_extend(editor);
  register_DocHeadingCompo_extend(editor);
  register_DocCodeInlineCompo_extend(editor);
  register_DocLinkCompo_extend(editor);
}
