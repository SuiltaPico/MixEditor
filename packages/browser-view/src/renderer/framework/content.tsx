import { Component, createEffect } from "solid-js";
import { NodeRenderer } from "../../common/render";
import { BvRenderableCompo } from "../../compo/renderable";
import { BvContext } from "../../context";

export const NodeRendererWrapper: NodeRenderer = (props) => {
  return () => {
    const ent_id = props.ent_id;
    const bv_ctx = props.bv_ctx;
    const { editor } = bv_ctx;
    const { ecs } = editor;

    const renderable = ecs.get_compo(ent_id, BvRenderableCompo.type) as
      | BvRenderableCompo
      | undefined;
    if (!renderable) return undefined;

    let rendered = renderable.render_result;

    if (!rendered) {
      rendered = renderable.renderer({
        ent_id,
        bv_ctx,
      });
      renderable.render_result = rendered;
    }

    return rendered.node;
  };
};

export const ContentRenderer: Component<{ bv_ctx: BvContext }> = (props) => {
  const { bv_ctx } = props;
  const content = bv_ctx.editor.content;

  createEffect(() => {
    console.log(content.root.get()!);
    console.log(bv_ctx.editor.ecs.get_compos(content.root.get()!));
  });

  return <NodeRendererWrapper ent_id={content.root.get()!} bv_ctx={bv_ctx} />;
};
