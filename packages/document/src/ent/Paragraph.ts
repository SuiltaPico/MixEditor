import {
  ArrayChildCompo,
  ChildCompo,
  EntInitBehavior,
  MixEditor,
  ParentEntCompo,
} from "@mixeditor/core";

export function register_text_ent(editor: MixEditor) {
  const ecs_ctx = editor.ecs;

  ecs_ctx.set_ent_behaviors("paragraph", {
    [EntInitBehavior]({ it, ex_ctx }) {
      // ex_ctx.pipe.set_pipe(it.id, "paragraph");

      const ecs = ex_ctx.ecs;
      ecs.set_compos(it.id, [
        new ChildCompo(ArrayChildCompo.type),
        new ArrayChildCompo([]),
        new ParentEntCompo(undefined),
      ]);
    },
  });
}
