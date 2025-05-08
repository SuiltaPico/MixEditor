import { MixEditor } from "../../core/mix_editor";
import { ECSEntInitEvent } from "../../ecs";
import { register_RootEnt, RootEntInitPipeId } from "./root";
import { register_TempEnt } from "./temp";

export * from "./root";
export * from "./temp";

export function register_ents(core: MixEditor) {
  register_RootEnt(core);
  register_TempEnt(core);
}

export interface CoreEntInitPipeEventMap {
  [RootEntInitPipeId]: ECSEntInitEvent;
}
