import { MixEditor } from "@mixeditor/core";
import { DocFormatCompoExtendMap, register_format_compos } from "./format";
import { register_extend_compos } from "./extends";
import { DocConfigCompo } from "./base/doc_config";
import { register_base_compos } from "./base";

export * from "./base";
export * from "./format";
export * from "./extends";

export function register_compos(editor: MixEditor) {
  register_format_compos(editor);
  register_extend_compos(editor);
  register_base_compos(editor);
}

export interface DocCompoMap extends DocFormatCompoExtendMap {
  [DocConfigCompo.type]: DocConfigCompo;
}
