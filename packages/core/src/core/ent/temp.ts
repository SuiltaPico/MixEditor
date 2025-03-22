import { create_ent_registration, EntInitPipeEvent } from "../../common/ent";

const {
  EntType: TempEntType,
  EntInitPipeId: TempEntInitPipeId,
  register_ent: register_TempEnt,
} = create_ent_registration({
  namespace: "core",
  ent_type: "core:temp",
});

export { TempEntType, TempEntInitPipeId, register_TempEnt };
export type TempEntInitPipeEvent = EntInitPipeEvent<typeof TempEntInitPipeId>;
