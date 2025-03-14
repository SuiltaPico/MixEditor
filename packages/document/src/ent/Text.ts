import {
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentEntCompo,
  TextChildCompo,
} from "@mixeditor/core";
import {
  BorderPolicy,
  ChildDeletePolicy,
  DocEntTraitsCompo,
  SelfDeletePolicy,
} from "../compo/doc_ent_traits";

const default_ChildCompo = new ChildCompo(TextChildCompo.type);
const default_DocEntTraitsCompo = new DocEntTraitsCompo({
  can_children_enter: false,
  can_self_enter: true,
  border_policy: BorderPolicy.None,
  self_delete_from_caret_policy: SelfDeletePolicy.WhenEmpty,
  child_delete_from_caret_policy: ChildDeletePolicy.Absorb,
});

const {
  EntType: TextEntType,
  EntInitPipeId: TextEntInitPipeId,
  register_ent: register_TextEnt,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "text",
  init_stage_execute: async (event) => {
    const { it, ex_ctx } = event;
    ex_ctx.ecs.set_compos(it.id, [
      default_ChildCompo,
      new TextChildCompo(""),
      new ParentEntCompo(undefined),
      default_DocEntTraitsCompo,
    ]);
  },
});

export { TextEntType, TextEntInitPipeId, register_TextEnt };
export type TextEntInitPipeEvent = EntInitPipeEvent<typeof TextEntInitPipeId>;
