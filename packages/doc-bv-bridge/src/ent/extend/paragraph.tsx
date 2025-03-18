import {
  bv_forward_pointer_event,
  BvRenderableCompo,
  BvRenderSelectionDecision,
  DOMCaretPos,
  from_solidjs_compo,
  get_caret_pos_from_point,
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

  function handle_pointer_event(event: PointerEvent) {
    bv_forward_pointer_event(editor, ent_id, event);
  }

  return (
    <p
      class="_paragraph"
      onPointerDown={handle_pointer_event}
      onPointerMove={handle_pointer_event}
    >
      <For each={ent_child_compo.children.get()}>
        {(child_id) => (
          <NodeRendererWrapper ent_id={child_id} bv_ctx={props.bv_ctx} />
        )}
      </For>
    </p>
  );
};

function get_child_pos(
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

  const ent_child_compo = ecs.get_compo(params.ent_id, EntChildCompo.type);
  const children = ent_child_compo.children.get();

  // 简化子元素获取逻辑
  const child_id = children[params.index] ?? children[params.index - 1];
  const is_last_position = params.index === children.length;

  const child_render_result = ecs.get_compo(
    child_id,
    BvRenderableCompo.type
  )?.render_result;
  if (!child_render_result) return undefined;

  const child_node = child_render_result.node as HTMLElement;
  const child_rects = child_node.getClientRects();

  // 简化矩形计算
  const child_rect = is_last_position
    ? child_rects[child_rects.length - 1]
    : child_rects[0];

  return {
    x: (is_last_position ? child_rect.right : child_rect.left) - root_rect.x,
    y: child_rect.top - root_rect.y,
    height: child_rect.height,
  };
}

function handle_pointer_event_forward(
  params: Parameters<
    Exclude<BvRenderableCompo["handle_pointer_event_forward"], undefined>
  >[0]
) {
  const { editor, ent_id, event, pos } = params;
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
        custom_get_child_pos: get_child_pos,
        render_selection_policy: BvRenderSelectionDecision.Traverse,
        handle_pointer_event_forward: handle_pointer_event_forward,
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
