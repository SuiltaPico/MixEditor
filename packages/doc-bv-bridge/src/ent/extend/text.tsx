import {
  BvRenderableCompo,
  from_solidjs_compo,
  NodeRenderer
} from "@mixeditor/browser-view";
import { MixEditor, TextChildCompo } from "@mixeditor/core";
import { TextEntInitPipeId } from "@mixeditor/document";

export const TextEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;

  const text_compo = ecs.get_compo(ent_id, TextChildCompo.type);

  return <span>{text_compo.content.get()}</span>;
};

export function register_TextEnt_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(TextEntInitPipeId)!;

  init_pipe.set_stage({
    id: "doc_bv_bridge",
    execute: async (event) => {
      const { it } = event;
      const { ecs } = editor;

      const bv_renderable_compo = new BvRenderableCompo({
        renderer: from_solidjs_compo(TextEntRenderer),
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
