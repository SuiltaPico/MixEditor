import { create_ent_registration, EntInitPipeEvent } from "../../common/ent";
import { EntChildCompo } from "../compo/tree/ent_child";
import { ChildCompo } from "../compo/tree/child";
import { set_children_parent_refs } from "../../common";
import { MixEditor } from "../mix_editor";

const default_ChildCompo = new ChildCompo(EntChildCompo.type);

const {
  EntType: RootEntType,
  EntInitPipeId: RootEntInitPipeId,
  register_ent: register_RootEnt_init_pipe,
} = create_ent_registration({
  namespace: "core",
  ent_type: "core:root",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    const children = init_params?.children ?? [];

    set_children_parent_refs(ex_ctx.ecs, children, it.id);

    ex_ctx.ecs.set_compos(it.id, [new EntChildCompo(children)]);
  },
});

function register_RootEnt(editor: MixEditor) {
  editor.ecs.set_ent_default_compo(RootEntType, default_ChildCompo);
  
  return register_RootEnt_init_pipe(editor);
}

export { RootEntType, RootEntInitPipeId, register_RootEnt };
export type RootEntInitPipeEvent = EntInitPipeEvent<typeof RootEntInitPipeId>;
