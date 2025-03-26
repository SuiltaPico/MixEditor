import {
  bv_forward_pointer_event,
  BvRenderableCompo,
  BvRenderSelectionDecision,
  from_solidjs_compo,
  NodeRenderer,
  NodeRendererWrapper,
} from "@mixeditor/browser-view";
import {
  create_TreeCollapsedSelection,
  EntChildCompo,
  MixEditor,
} from "@mixeditor/core";
import { ParagraphEntInitPipeId } from "@mixeditor/document";
import { For } from "solid-js";
import "./paragraph.css";

export const ParagraphEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;
  const ent_child_compo = ecs.get_compo(ent_id, EntChildCompo.type)!;

  function handle_pointer_down(event: PointerEvent) {
    if (ent_child_compo.count() === 0) {
      editor.selection.set_selection(
        create_TreeCollapsedSelection({
          ent_id,
          offset: 0,
        })
      );
    } else {
      bv_forward_pointer_event(editor, ent_id, event);
    }
  }

  function handle_pointer_move(event: PointerEvent) {
    bv_forward_pointer_event(editor, ent_id, event);
    // editor.selection.set_selection(
    //   create_TreeCollapsedSelection({
    //     ent_id,
    //     offset: 0,
    //   })
    // );
  }

  return (
    <p
      class="__paragraph"
      onPointerDown={handle_pointer_down}
      onPointerMove={handle_pointer_move}
    >
      <For each={ent_child_compo.children.get()}>
        {(child_id) => (
          <NodeRendererWrapper ent_id={child_id} bv_ctx={props.bv_ctx} />
        )}
      </For>
    </p>
  );
};

export function get_paragraph_child_pos(
  params: Parameters<
    Exclude<BvRenderableCompo["custom_get_child_pos"], undefined>
  >[0]
) {
  const { editor, root_rect } = params;
  const { ecs } = editor;
  const bv_renderable_compo = ecs.get_compo(
    params.ent_id,
    BvRenderableCompo.type
  );
  if (!bv_renderable_compo) return;
  const render_result = bv_renderable_compo.render_result;
  if (!render_result) return;

  const ent_child_compo = ecs.get_compo(params.ent_id, EntChildCompo.type)!;
  if (ent_child_compo.count() === 0) {
    const self_rect = (
      render_result.final_node! as HTMLElement
    ).getBoundingClientRect();
    return {
      x: self_rect.left - root_rect.x,
      y: self_rect.top - root_rect.y,
      height: self_rect.height,
    };
  }
  const children = ent_child_compo.children.get();

  const child_id = children[params.index] ?? children[params.index - 1];
  const is_last_position = params.index === children.length;

  const child_render_result = ecs.get_compo(
    child_id,
    BvRenderableCompo.type
  )?.render_result;
  if (!child_render_result) return undefined;

  const child_node = child_render_result.node as HTMLElement;
  const child_rects = child_node.getClientRects();

  const child_rect = is_last_position
    ? child_rects[child_rects.length - 1]
    : child_rects[0];

  return {
    x: (is_last_position ? child_rect.right : child_rect.left) - root_rect.x,
    y: child_rect.top - root_rect.y,
    height: child_rect.height,
  };
}

export function handle_paragraph_pointer_event_forward(
  params: Parameters<
    Exclude<BvRenderableCompo["handle_pointer_event_forward"], undefined>
  >[0]
) {
  const { editor, ent_id, event, pos } = params;
  const ent_child_compo = editor.ecs.get_compo(ent_id, EntChildCompo.type)!;
  if (event.type === "pointerdown" && ent_child_compo.count() === 0) {
    editor.selection.set_selection(
      create_TreeCollapsedSelection({
        ent_id,
        offset: 0,
      })
    );
  }
  bv_forward_pointer_event(editor, ent_id, event, pos);
}

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
        custom_get_child_pos: get_paragraph_child_pos,
        render_selection_policy: BvRenderSelectionDecision.Traverse,
        handle_pointer_event_forward: handle_paragraph_pointer_event_forward,
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
