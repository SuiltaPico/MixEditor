import { create_ent_registration, EntInitPipeEvent } from "../../common/ent";
import { EntChildCompo } from "../compo/tree/ent_child";
import { ChildCompo } from "../compo/tree/child";
import { ParentEntCompo } from "../compo";

const {
  EntType: RootEntType,
  EntInitPipeId: RootEntInitPipeId,
  register_ent: register_RootEnt,
} = create_ent_registration({
  namespace: "core",
  ent_type: "core:root",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    const children = init_params?.children ?? [];
    for (const child of children) {
      const parent_compo = ex_ctx.ecs.get_compo(child, ParentEntCompo.type);
      if (!parent_compo) {
        ex_ctx.ecs.set_compos(child, [new ParentEntCompo(it.id)]);
      }
      parent_compo.parent_id.set(it.id);
    }
    ex_ctx.ecs.set_compos(it.id, [
      new EntChildCompo(init_params?.children ?? []),
      new ChildCompo(EntChildCompo.type),
    ]);
  },
});

export { RootEntType, RootEntInitPipeId, register_RootEnt };
export type RootEntInitPipeEvent = EntInitPipeEvent<typeof RootEntInitPipeId>;
