import { MixEditor } from "../../mix_editor";
import {
  ChildCompo,
  ChildCompoCreateParams,
  register_ChildCompo,
} from "./child";
import {
  EntChildCompo,
  EntChildCompoCreateParams,
  register_EntChildCompo,
} from "./ent_child";
import {
  ParentCompo,
  ParentCompoCreateParams,
  register_ParentEntCompo,
} from "./parent";
import {
  register_TextChildCompo,
  TextChildCompo,
  TextChildCompoCreateParams,
} from "./text_child";

export * from "./cb";
export * from "./child";
export * from "./ent_child";
export * from "./parent";
export * from "./text_child";

export function register_tree_compos(editor: MixEditor) {
  register_EntChildCompo(editor);
  register_TextChildCompo(editor);
  register_ParentEntCompo(editor);
  register_ChildCompo(editor);
}

export interface TreeCompoCreateParamsMap {
  [EntChildCompo.type]: EntChildCompoCreateParams;
  [TextChildCompo.type]: TextChildCompoCreateParams;
  [ParentCompo.type]: ParentCompoCreateParams;
  [ChildCompo.type]: ChildCompoCreateParams;
}
