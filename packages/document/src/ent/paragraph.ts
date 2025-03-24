import {
  ChildCompo,
  create_ent_registration,
  EntChildCompo,
  EntInitPipeEvent,
  ParentCompo,
  set_children_parent_refs,
  MixEditor,
  WalkDecision,
} from "@mixeditor/core";
import {
  BackBorderStrategy,
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
  FrontBorderStrategy,
} from "../compo/base/doc_config";

const default_ChildCompo = new ChildCompo(EntChildCompo.type);
const default_DocEntTraitsCompo = new DocConfigCompo({
  box_type: "block",
  allow_enter_children: true,
  allow_enter_self: true,
  border_type: BorderType.Closed,
  caret_delete_policy: CaretDeleteStrategy.PropagateToChild,
  front_border_strategy: FrontBorderStrategy.MergeWithPrev,
  back_border_strategy: BackBorderStrategy.PropagateToNext,
  insert_filter: (params) => {
    const { curr_ent_id, editor } = params;
    const { ecs } = editor;

    const doc_config_compo = ecs.get_compo(curr_ent_id, DocConfigCompo.type);
    if (!doc_config_compo) {
      return WalkDecision.StopWalk;
    }

    if (doc_config_compo.box_type === "block") {
      const child_compo = ecs.get_compo(curr_ent_id, EntChildCompo.type);
      if (!child_compo) {
        return WalkDecision.StopWalk;
      }
    } else {
      return WalkDecision.StopWalk;
    }
  },
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
