import {
  ChildCompo,
  create_ent_registration,
  EntInitPipeEvent,
  ParentCompo,
  TextChildCompo,
  MixEditor,
  WalkDecision,
} from "@mixeditor/core";
import {
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
  BackBorderStrategy,
} from "../compo/base/doc_config";
import { LoopDecision } from "@mixeditor/common";
import { get_merge_decision, InsertMethod } from "../pipe";
const default_ChildCompo = new ChildCompo(TextChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  box_type: "inline",
  allow_enter_children: false,
  allow_enter_self: true,
  border_type: BorderType.Open,
  caret_delete_policy: CaretDeleteStrategy.DeleteChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
  get_insert_method: async (params) => {
    const { curr_ent_id, editor, ent_id } = params;
    const { ecs } = editor;

    const doc_config_compo = ecs.get_compo(curr_ent_id, DocConfigCompo.type);
    if (!doc_config_compo || doc_config_compo.box_type !== "inline") {
      return LoopDecision.Break;
    }

    const decision = await get_merge_decision(
      editor,
      ent_id,
      curr_ent_id,
      true
    );
    if (decision.type === "reject") {
      return LoopDecision.Break;
    }

    return InsertMethod.Insert();
  },
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
