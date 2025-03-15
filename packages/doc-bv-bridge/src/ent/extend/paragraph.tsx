import {
  BvRenderableCompo,
  from_solidjs_compo,
  NodeRenderer,
  NodeRendererWrapper,
} from "@mixeditor/browser-view";
import { EntChildCompo, MixEditor } from "@mixeditor/core";
import { ParagraphEntInitPipeId } from "@mixeditor/document";
import { For } from "solid-js";

export const ParagraphEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;

  const ent_child_compo = ecs.get_compo(ent_id, EntChildCompo.type);

  return (
    <p>
      <For each={ent_child_compo.children.get()}>
        {(child_id) => (
          <NodeRendererWrapper ent_id={child_id} bv_ctx={props.bv_ctx} />
        )}
      </For>
    </p>
  );
};

export function register_ParagraphEnt_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(ParagraphEntInitPipeId)!;

  init_pipe.set_stage({
    id: "doc_bv_bridge",
    execute: async (event) => {
      const { it } = event;
      const { ecs } = editor;

      const bv_renderable_compo = new BvRenderableCompo({
        renderer: from_solidjs_compo(ParagraphEntRenderer),
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
