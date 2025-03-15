import { register_RootEnt } from "./root";
import { MixEditor } from "../../core/mix_editor";

export * from "./root";
export function register_core_ents(core: MixEditor) {
  register_RootEnt(core);
}
