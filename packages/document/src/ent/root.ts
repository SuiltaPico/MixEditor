import { MixEditor, RootEntInitPipeId, RootEntType } from "@mixeditor/core";
import {
  BorderType,
  CaretDeleteStrategy,
  DocConfigCompo,
} from "../compo/base/doc_config";
import { InsertMethod } from "../pipe";
import { LoopDecision } from "@mixeditor/common";

export function register_RootEnt_doc_extend(editor: MixEditor) {
  const { pipe, ecs } = editor;
  const init_pipe = pipe.get_pipe(RootEntInitPipeId)!;
  init_pipe.set_stage({
    id: "doc",
    execute(event) {
      const { it, ex_ctx } = event;
      ex_ctx.ecs.set_compos(it.id, [
        new DocConfigCompo({
          box_type: "container",
          allow_enter_children: true,
          allow_enter_self: false,
          border_type: BorderType.Open,
          caret_delete_policy: CaretDeleteStrategy.PropagateToChild,
          get_insert_method: async (params) => {
            const { curr_ent_id, editor } = params;
            const { ecs } = editor;

            const doc_config_compo = ecs.get_compo(
              curr_ent_id,
              DocConfigCompo.type
            );

            if (!doc_config_compo) {
              return LoopDecision.Break;
            }

            if (doc_config_compo.box_type === "block") {
              return InsertMethod.Insert();
            }

            return LoopDecision.Break;
          },
        }),
      ]);
    },
  });
  return () => {
    pipe.get_pipe(RootEntInitPipeId)?.delete_stage("doc");
  };
}
