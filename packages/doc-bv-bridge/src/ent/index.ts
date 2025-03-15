import { MixEditor } from "@mixeditor/core";
import { register_ent_extend } from "./extend";

export * from "./extend";

export function register_ents(editor: MixEditor) {
  register_ent_extend(editor);
}
