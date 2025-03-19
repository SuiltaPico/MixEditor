import {
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentEntCompo,
  TextChildCompo,
} from "@mixeditor/core";
import {
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
  BackBorderStrategy,
  RangeDeleteStrategy,
} from "../compo/doc_config";

const default_ChildCompo = new ChildCompo(TextChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  allow_enter_children: false,
  allow_enter_self: true,
  border_type: BorderType.Open,
  caret_delete_policy: CaretDeleteStrategy.DeleteChild,
  range_delete_policy: RangeDeleteStrategy.DeleteChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
});

const {
  EntType: TextEntType,
  EntInitPipeId: TextEntInitPipeId,
  register_ent: register_TextEnt,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:text",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    ex_ctx.ecs.set_compos(it.id, [
      default_ChildCompo,
      new TextChildCompo(init_params?.text ?? ""),
      new ParentEntCompo(undefined),
      default_DocEntTraitsCompo,
    ]);
  },
});

export { register_TextEnt, TextEntInitPipeId, TextEntType };
export type TextEntInitPipeEvent = EntInitPipeEvent<typeof TextEntInitPipeId>;
