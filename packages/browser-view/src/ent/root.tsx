import {
  EntChildCompo,
  MixEditor,
  RootEntInitPipeId,
  RootEntType,
} from "@mixeditor/core";
import { from_solidjs_compo, NodeRenderer } from "../common/render";
import { BvChildPositionCompo } from "../compo/child_position";
import { BvRenderableCompo } from "../compo/renderable";
import { NodeRendererWrapper } from "../renderer/framework/content";
import { For } from "solid-js";

/** 根节点渲染器。
 *
 * 负责渲染根节点。
 */
export const RootRenderer: NodeRenderer = (props) => {
  const editor = props.bv_ctx.editor;
  const { ecs } = editor;
  const child = ecs.get_compo(props.ent_id, EntChildCompo.type);
  return (
    <div class="_root">
      <For each={child.children.get()}>
        {(child) => {
          return <NodeRendererWrapper ent_id={child} bv_ctx={props.bv_ctx} />;
        }}
      </For>
    </div>
  );
};

export function register_RootEnt_bv_extend(editor: MixEditor) {
  const { ecs, pipe } = editor;
  const child_position_compo = new BvChildPositionCompo({
    custom_getter: (params) => {
      const renderable = ecs.get_compo(params.ent_id, BvRenderableCompo.type);
      if (!renderable) {
        return undefined;
      }

      const render_result = renderable.render_result;
      if (!render_result) {
        return undefined;
      }

      const node = render_result.node as HTMLElement;
      const rect = node.getBoundingClientRect();

      const child_rect = node.children[params.index].getBoundingClientRect();

      return {
        x: child_rect.left - rect.left,
        y: child_rect.top - rect.top,
        height: child_rect.height,
      };
    },
  });

  const init_pipe = pipe.get_pipe(RootEntInitPipeId)!;
  init_pipe.set_stage({
    id: "bv",
    execute: async (event) => {
      ecs.set_compos(event.it.id, [
        new BvRenderableCompo({
          renderer: from_solidjs_compo(RootRenderer),
        }),
        child_position_compo,
      ]);
    },
  });
}
