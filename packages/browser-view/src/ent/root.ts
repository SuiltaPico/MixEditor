import { MixEditor, RootEntInitPipeId, RootEntType } from "@mixeditor/core";
import { BvRenderableCompo } from "../compo/renderable";
import { create_solidjs_rendered } from "../renderer/node_renderer";
import { RootRenderer } from "../renderer/root";

export function register_RootEnt_bv_extend(editor: MixEditor) {
  const { ecs, pipe } = editor;

  const init_pipe = pipe.get_pipe(RootEntInitPipeId)!;
  init_pipe.set_stage({
    id: "bv",
    execute: async (event) => {
      ecs.set_compos(RootEntType, [
        new BvRenderableCompo({
          render: create_solidjs_rendered(RootRenderer),
        }),
      ]);
    },
  });
}
