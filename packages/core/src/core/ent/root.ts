import { create_ent_registration } from "../../common/ent";
import { EntChildCompo } from "../compo/tree/ent_child";
import { ChildCompo } from "../compo/tree/child";
import { set_children_parent_refs } from "../../common";
import { MixEditor } from "../mix_editor";
import { TypeCompo } from "../compo";

export const root_ent_TypeCompo = new TypeCompo("core:root");
export const root_ent_ChildCompo = new ChildCompo(EntChildCompo.type);

const {
  EntType: RootEntType,
  EntInitPipeId: RootEntInitPipeId,
  register_ent: register_RootEnt_init_pipe,
} = create_ent_registration({
  namespace: "core",
  ent_type: "core:root",
  init_stage_execute: async (event) => {
    const { ent_id, ex_ctx, params } = event;
    const children = params?.children ?? [];

    set_children_parent_refs(ex_ctx.ecs, children, ent_id);

    ex_ctx.ecs.set_compos(ent_id, [
      root_ent_TypeCompo,
      root_ent_ChildCompo,
      new EntChildCompo(children),
    ]);
  },
});

function register_RootEnt(editor: MixEditor) {
  return register_RootEnt_init_pipe(editor);
}

export { RootEntType, RootEntInitPipeId, register_RootEnt };
