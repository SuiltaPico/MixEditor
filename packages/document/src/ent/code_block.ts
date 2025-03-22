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
import { DocCodeBlockCompo } from "../compo";

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
  EntType: CodeBlockEntType,
  EntInitPipeId: CodeBlockEntInitPipeId,
  register_ent: register_CodeBlockEnt_init_pipe,
} = create_ent_registration({
  namespace: "doc",
  ent_type: "doc:code_block",
  init_stage_execute: async (event) => {
    const { it, ex_ctx, init_params } = event;
    const children = init_params?.children ?? [];

    set_children_parent_refs(ex_ctx.ecs, children, it.id);

    ex_ctx.ecs.set_compos(it.id, [
      new EntChildCompo(children),
      new ParentCompo(undefined),
      new DocCodeBlockCompo(),
    ]);
  },
});

function register_CodeBlockEnt(editor: MixEditor) {
  register_CodeBlockEnt_init_pipe(editor);

  editor.ecs.set_ent_default_compo(CodeBlockEntType, default_ChildCompo);
  editor.ecs.set_ent_default_compo(CodeBlockEntType, default_DocEntTraitsCompo);
}

export { CodeBlockEntInitPipeId, CodeBlockEntType, register_CodeBlockEnt };
export type CodeBlockEntInitPipeEvent = EntInitPipeEvent<
  typeof CodeBlockEntInitPipeId
>;
