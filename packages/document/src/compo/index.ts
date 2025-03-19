import { MixEditor } from "@mixeditor/core";
import { register_format_compos } from "./format";
import { register_extend_compos } from "./extends";

export * from "./doc_config";
export * from "./format";
export * from "./extends";

export function register_compos(editor: MixEditor) {
  register_format_compos(editor);
  register_extend_compos(editor);
}
