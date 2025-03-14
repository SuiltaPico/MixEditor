import { create_ent_registration, EntInitPipeEvent } from "../../common/ent";
import { EntChildCompo } from "../compo/tree/ent_child";
import { ChildCompo } from "../compo/tree/child";

const {
  EntType: RootEntType,
  EntInitPipeId: RootEntInitPipeId,
  register_ent: register_RootEnt,
} = create_ent_registration({
  namespace: "core",
  ent_type: "core:root",
  init_stage_execute: async (event) => {
    const { it, ex_ctx } = event;
    ex_ctx.ecs.set_compos(it.id, [
      new EntChildCompo([]),
      new ChildCompo(EntChildCompo.type),
    ]);
  },
});

export { RootEntType, RootEntInitPipeId, register_RootEnt };
export type RootEntInitPipeEvent = EntInitPipeEvent<typeof RootEntInitPipeId>;
