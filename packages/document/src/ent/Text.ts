import {
  ChildEntCompo,
  EntInitBehavior,
  MixEditor,
  ParentEntCompo,
  TextContentCompo
} from "@mixeditor/core";

export function register_text_ent(editor: MixEditor) {
  const ecs_ctx = editor.ecs;

  ecs_ctx.set_ent_behavior("text", EntInitBehavior, ({ it, ex_ctx }) => {
    const ecs = ex_ctx.ecs;
    ecs.set_compos(it.id, [
      new ChildEntCompo(TextContentCompo.type),
      new TextContentCompo(""),
      new ParentEntCompo(undefined),
    ]);
  });
}
