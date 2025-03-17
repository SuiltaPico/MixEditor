import {
  EntChildCompo,
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentEntCompo,
} from "@mixeditor/core";
import {
  BorderPolicy,
  ChildDeletePolicy,
  DocEntTraitsCompo,
  SelfDeletePolicy,
} from "../compo/doc_ent_traits";

const default_ChildCompo = new ChildCompo(EntChildCompo.type);
const default_DocEntTraitsCompo = new DocEntTraitsCompo({
  can_children_enter: true,
  can_self_enter: true,
  border_policy: BorderPolicy.Bordered,
  self_delete_from_caret_policy: SelfDeletePolicy.Normal,
  child_delete_from_caret_policy: ChildDeletePolicy.Propagate,
});

const {
  EntType: ParagraphEntType,
  EntInitPipeId: ParagraphEntInitPipeId,
  register_ent: register_ParagraphEnt,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:paragraph",
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
      default_ChildCompo,
      new EntChildCompo(children),
      new ParentEntCompo(undefined),
      default_DocEntTraitsCompo,
    ]);
  },
});

export { ParagraphEntType, ParagraphEntInitPipeId, register_ParagraphEnt };
export type ParagraphEntInitPipeEvent = EntInitPipeEvent<
  typeof ParagraphEntInitPipeId
>;
