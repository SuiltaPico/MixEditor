import {
  ChildEntArrayCompo,
  ChildEntCompo,
  EntInitBehavior,
  MixEditor,
  ParentEntCompo,
} from "@mixeditor/core";

export function register_text_ent(editor: MixEditor) {
  const ecs_ctx = editor.ecs;

  ecs_ctx.set_ent_behavior("paragraph", EntInitBehavior, ({ it, ex_ctx }) => {
    const ecs = ex_ctx.ecs;
    ecs.set_compos(it.id, [
      new ChildEntCompo(ChildEntArrayCompo.type),
      new ChildEntArrayCompo([]),
      new ParentEntCompo(undefined),
    ]);
  });
}
