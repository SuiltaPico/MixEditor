import { create_ent_registration } from "../../common/ent";
import { ECSEntInitEvent } from "../../ecs";
import { TypeCompo } from "../compo";

const ent_type = "core:temp";
export const temp_ent_TypeCompo = new TypeCompo(ent_type);
const {
  EntType: TempEntType,
  EntInitPipeId: TempEntInitPipeId,
  register_ent: register_TempEnt,
} = create_ent_registration({
  namespace: "core",
  ent_type,
  init_stage_execute: async (event) => {
    const { ent_id, ex_ctx, params } = event;

    ex_ctx.ecs.set_compos(ent_id, [
      temp_ent_TypeCompo,
    ]);
  },
});

export { TempEntType, TempEntInitPipeId, register_TempEnt };
export type TempEntInitPipeEvent = ECSEntInitEvent;
