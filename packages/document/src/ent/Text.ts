import {
  ChildCompo,
  EntInitBehavior,
  MixEditor,
  ParentEntCompo,
  TextChildCompo,
} from "@mixeditor/core";

export function register_text_ent(editor: MixEditor) {
  const ecs_ctx = editor.ecs;

  ecs_ctx.set_ent_behavior("text", EntInitBehavior, ({ it, ex_ctx }) => {
    const ecs = ex_ctx.ecs;
    ecs.set_compos(it.id, [
      new ChildCompo(TextChildCompo.type),
      new TextChildCompo(""),
      new ParentEntCompo(undefined),
    ]);
  });
}
