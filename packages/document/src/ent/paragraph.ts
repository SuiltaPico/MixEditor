import {
  EntChildCompo,
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentEntCompo,
  set_children_parent_refs,
} from "@mixeditor/core";
import {
  BackBorderStrategy,
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
  RangeDeleteStrategy,
} from "../compo/doc_config";

const default_ChildCompo = new ChildCompo(EntChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  allow_enter_children: true,
  allow_enter_self: true,
  border_type: BorderType.Closed,
  caret_delete_policy: CaretDeleteStrategy.PropagateToChild,
  range_delete_policy: RangeDeleteStrategy.DeleteChild,
  front_border_strategy:
    FrontBorderStrategy.MergeWithPrev,
  back_border_strategy:
    BackBorderStrategy.PropagateToNext,
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

    set_children_parent_refs(ex_ctx.ecs, children, it.id);

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
