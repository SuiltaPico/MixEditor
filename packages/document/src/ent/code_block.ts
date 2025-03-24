import {
  ChildCompo,
  create_ent_registration,
  EntChildCompo,
  EntInitPipeEvent,
  ParentCompo,
  set_children_parent_refs,
  MixEditor,
  TextChildCompo,
} from "@mixeditor/core";
import {
  BackBorderStrategy,
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
} from "../compo/base/doc_config";
import {  DocCodeBlockCompo } from "../compo";

const default_ChildCompo = new ChildCompo(TextChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  box_type: "block",
  allow_enter_children: true,
  allow_enter_self: true,
  border_type: BorderType.Closed,
  caret_delete_policy: CaretDeleteStrategy.PropagateToChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
});

const {
  EntType: CodeBlockEntType,
  EntInitPipeId: CodeBlockEntInitPipeId,
  register_ent: register_CodeBlockEnt_init_pipe,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:code_block",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    const content = init_params?.content ?? "";

    ex_ctx.ecs.set_compos(it.id, [
      new TextChildCompo(content),
      new DocCodeBlockCompo(),
    ]);
  },
});

function register_CodeBlockEnt(editor: MixEditor) {
  editor.ecs.set_ent_default_compo(CodeBlockEntType, default_ChildCompo);
  editor.ecs.set_ent_default_compo(CodeBlockEntType, default_DocEntTraitsCompo);
  return register_CodeBlockEnt_init_pipe(editor);
}

export { CodeBlockEntInitPipeId, CodeBlockEntType, register_CodeBlockEnt };
export type CodeBlockEntInitPipeEvent = EntInitPipeEvent<
  typeof CodeBlockEntInitPipeId
>;
