import { MixEditor, RootEntInitPipeId } from "@mixeditor/core";
import {
  BorderPolicy,
  ChildDeletePolicy,
  DocEntTraitsCompo,
  SelfDeletePolicy,
} from "../compo/doc_ent_traits";

export function register_RootEnt_doc_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(RootEntInitPipeId)!;
  init_pipe.set_stage({
    id: "doc",
    execute(event) {
      const { it, ex_ctx } = event;
      ex_ctx.ecs.set_compos(it.id, [
        new DocEntTraitsCompo({
          can_children_enter: true,
          can_self_enter: false,
          border_policy: BorderPolicy.None,
          self_delete_from_caret_policy: SelfDeletePolicy.Never,
          child_delete_from_caret_policy: ChildDeletePolicy.Propagate,
        }),
      ]);
    },
  });
  return () => {
    pipe.get_pipe(RootEntInitPipeId)?.delete_stage("doc");
  };
}
