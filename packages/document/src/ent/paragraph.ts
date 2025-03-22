import {
  ChildCompo,
  create_ent_registration,
  EntChildCompo,
  EntInitPipeEvent,
  ParentCompo,
  set_children_parent_refs,
  MixEditor,
} from "@mixeditor/core";
import {
  BackBorderStrategy,
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
} from "../compo/doc_config";

const default_ChildCompo = new ChildCompo(EntChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  allow_enter_children: true,
  allow_enter_self: true,
  border_type: BorderType.Closed,
  caret_delete_policy: CaretDeleteStrategy.PropagateToChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
});

const {
  EntType: ParagraphEntType,
  EntInitPipeId: ParagraphEntInitPipeId,
  register_ent: register_ParagraphEnt_init_pipe,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:paragraph",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    const children = init_params?.children ?? [];

    set_children_parent_refs(ex_ctx.ecs, children, it.id);

    ex_ctx.ecs.set_compos(it.id, [
      new EntChildCompo(children),
      new ParentCompo(undefined),
    ]);
  },
});

function register_ParagraphEnt(editor: MixEditor) {
  editor.ecs.set_ent_default_compo(ParagraphEntType, default_ChildCompo);
  editor.ecs.set_ent_default_compo(ParagraphEntType, default_DocEntTraitsCompo);
  return register_ParagraphEnt_init_pipe(editor);
}

export { ParagraphEntInitPipeId, ParagraphEntType, register_ParagraphEnt };
export type ParagraphEntInitPipeEvent = EntInitPipeEvent<
  typeof ParagraphEntInitPipeId
>;
