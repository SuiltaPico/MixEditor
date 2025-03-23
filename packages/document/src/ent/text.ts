import {
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentCompo,
  TextChildCompo,
  MixEditor,
} from "@mixeditor/core";
import {
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
  BackBorderStrategy,
} from "../compo/doc_config";

const default_ChildCompo = new ChildCompo(TextChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  allow_enter_children: false,
  allow_enter_self: true,
  border_type: BorderType.Open,
  caret_delete_policy: CaretDeleteStrategy.DeleteChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
});

const {
  EntType: TextEntType,
  EntInitPipeId: TextEntInitPipeId,
  register_ent: register_TextEnt_init_pipe,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:text",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    ex_ctx.ecs.set_compos(it.id, [
      new TextChildCompo(init_params?.content ?? ""),
      new ParentCompo(undefined),
    ]);
  },
});

function register_TextEnt(editor: MixEditor) {
  editor.ecs.set_ent_default_compo(TextEntType, default_ChildCompo);
  editor.ecs.set_ent_default_compo(TextEntType, default_DocEntTraitsCompo);
  return register_TextEnt_init_pipe(editor);
}

export { TextEntInitPipeId, TextEntType, register_TextEnt };
export type TextEntInitPipeEvent = EntInitPipeEvent<typeof TextEntInitPipeId>;
