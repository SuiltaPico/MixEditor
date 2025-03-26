import {
  EntChildCompo,
  MixEditor,
  RootEntInitPipeId
} from "@mixeditor/core";
import { For } from "solid-js";
import { from_solidjs_compo, NodeRenderer } from "../common/render";
import {
  BvRenderableCompo,
  BvRenderSelectionDecision,
} from "../compo/renderable";
import { bv_forward_pointer_event } from "../compo/utils";
import { NodeRendererWrapper } from "../renderer/framework/content";
import "./root.css";

/** 根节点渲染器。
 *
 * 负责渲染根节点。
 */
export const RootRenderer: NodeRenderer = (props) => {
  const editor = props.bv_ctx.editor;
  const { ecs } = editor;
  const child = ecs.get_compo(props.ent_id, EntChildCompo.type)!;
  return (
    <div
      class="_root"
      onPointerDown={(event) =>
        bv_forward_pointer_event(editor, props.ent_id, event)
      }
      onPointerMove={(event) =>
        bv_forward_pointer_event(editor, props.ent_id, event)
      }
      onPointerUp={(event) =>
        bv_forward_pointer_event(editor, props.ent_id, event)
      }
    >
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

  const init_pipe = pipe.get_pipe(RootEntInitPipeId)!;
  init_pipe.set_stage({
    id: "bv",
    execute: async (event) => {
      const renderable = new BvRenderableCompo({
        renderer: from_solidjs_compo(RootRenderer),
        custom_get_child_pos: (params) => {
          const render_result = renderable.render_result;
          if (!render_result) {
            return undefined;
          }

          const node = render_result.node as HTMLElement;
          const rect = node.getBoundingClientRect();

          const child_rect =
            node.children[params.index].getBoundingClientRect();

          return {
            x: child_rect.left - rect.left,
            y: child_rect.top - rect.top,
            height: child_rect.height,
          };
        },
        render_selection_policy: BvRenderSelectionDecision.Traverse,
      });
      ecs.set_compos(event.it.id, [renderable]);
    },
  });
}
