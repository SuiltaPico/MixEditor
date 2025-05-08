import { MixEditor } from "../../mix_editor";
import { register_TypeCompo, TypeCompo, TypeCompoCreateParams } from "./type";

export * from "./route";
export * from "./type";

export function register_basic_compos(editor: MixEditor) {
  register_TypeCompo(editor);
}

export interface BasicCompoMap {
  [TypeCompo.type]: {
    compo: TypeCompo;
    create_params: TypeCompoCreateParams;
  };
}
