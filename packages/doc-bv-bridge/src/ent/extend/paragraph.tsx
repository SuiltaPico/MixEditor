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
    <p class="_paragraph">
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
        custom_get_child_pos: (params) => {
          const render_result = bv_renderable_compo.render_result;
          const root_render_result = ecs.get_compo(
            editor.content.root.get()!,
            BvRenderableCompo.type
          )?.render_result;
          if (!render_result || !root_render_result) return undefined;

          const ent_child_compo = ecs.get_compo(it.id, EntChildCompo.type);
          const children = ent_child_compo.children.get();
          if (params.index < 0 || params.index > children.length)
            return undefined;

          const root_node = root_render_result.node as HTMLElement;
          const root_rect = root_node.getBoundingClientRect();

          // 获取目标子元素ID (最后位置或普通位置)
          const is_last_position = params.index === children.length;
          const child_id = is_last_position
            ? children[params.index - 1]
            : children[params.index];

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
            x:
              (is_last_position ? child_rect.right : child_rect.left) -
              root_rect.left,
            y: child_rect.top - root_rect.top,
            height: child_rect.height,
          };
        },
      });
      ecs.set_compo(it.id, bv_renderable_compo);
    },
  });
}
