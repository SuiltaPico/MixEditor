import {
  bv_forward_pointer_event,
  BvRenderableCompo,
  BvRenderSelectionDecision,
  from_solidjs_compo,
  NodeRenderer,
  NodeRendererWrapper,
} from "@mixeditor/browser-view";
import { EntChildCompo, MixEditor } from "@mixeditor/core";
import { CodeBlockEntInitPipeId } from "@mixeditor/document";
import { For } from "solid-js";
import "./code_block.css";
import {
  get_paragraph_child_pos,
  handle_paragraph_pointer_event_forward,
} from "./paragraph";

export const CodeBlockEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;
  const ent_child_compo = ecs.get_compo(ent_id, EntChildCompo.type);

  function handle_pointer_event(event: PointerEvent) {
    bv_forward_pointer_event(editor, ent_id, event);
  }

  return (
    <pre class="__code_block">
      <code
        onPointerDown={handle_pointer_event}
        onPointerMove={handle_pointer_event}
      >
        <For each={ent_child_compo.children.get()}>
          {(child_id) => (
            <NodeRendererWrapper ent_id={child_id} bv_ctx={props.bv_ctx} />
          )}
        </For>
      </code>
    </pre>
  );
};

export function register_CodeBlockEnt_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(CodeBlockEntInitPipeId)!;

  init_pipe.set_stage({
    id: "doc_bv_bridge",
    execute: async (event) => {
      const { it } = event;
      const { ecs } = editor;

      const bv_renderable_compo = new BvRenderableCompo({
        renderer: from_solidjs_compo(CodeBlockEntRenderer),
        custom_get_child_pos: get_paragraph_child_pos,
        render_selection_policy: BvRenderSelectionDecision.Traverse,
        handle_pointer_event_forward: handle_paragraph_pointer_event_forward,
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
