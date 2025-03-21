import { MixEditor } from "@mixeditor/core";
import {
  DocCodeBlockCompo,
  register_DocCodeBlockCompo,
} from "./block/code_block";
import { DocHeadingCompo, register_DocHeadingCompo } from "./block/heading";
import { DocTextBoldCompo, register_DocTextBoldCompo } from "./inline/bold";
import {
  DocCodeInlineCompo,
  register_DocCodeInlineCompo,
} from "./inline/code_inline";
import {
  DocTextItalicCompo,
  register_DocTextItalicCompo,
} from "./inline/italic";
import { DocLinkCompo, register_DocLinkCompo } from "./inline/link";

export * from "./block/code_block";
export * from "./block/heading";
export * from "./inline/bold";
export * from "./inline/code_inline";
export * from "./inline/italic";
export * from "./inline/link";

export function register_format_compos(editor: MixEditor) {
  register_DocTextBoldCompo(editor);
  register_DocTextItalicCompo(editor);
  register_DocLinkCompo(editor);
  register_DocHeadingCompo(editor);
  register_DocCodeInlineCompo(editor);
  register_DocCodeBlockCompo(editor);
}

export interface DocFormatCompoExtendMap {
  [DocTextBoldCompo.type]: DocTextBoldCompo;
  [DocTextItalicCompo.type]: DocTextItalicCompo;
  [DocLinkCompo.type]: DocLinkCompo;
  [DocHeadingCompo.type]: DocHeadingCompo;
  [DocCodeInlineCompo.type]: DocCodeInlineCompo;
  [DocCodeBlockCompo.type]: DocCodeBlockCompo;
}
