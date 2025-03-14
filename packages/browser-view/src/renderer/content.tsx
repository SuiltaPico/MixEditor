import { Ent, MixEditor } from "@mixeditor/core";
import {
  Component,
  createContext,
  createEffect,
  createRoot,
  JSX,
  on,
  onMount,
  useContext,
} from "solid-js";
import { BvContext, BvDomainContext } from "../context";
import { Rendered, RenderedDomNode } from "./node_renderer";
import { BvRenderableCompo } from "../compo/renderable";

export const default_renderer = () => {
  let dispose!: Rendered["dispose"];
  let el!: Rendered["node"];
  createRoot((d) => {
    dispose = d;
    el = (<div>未知节点</div>) as RenderedDomNode;
  });
  return {
    dispose,
    node: el,
  } satisfies Rendered;
};

export const NodeRendererWrapper: Component<{
  ent_id: string;
  bv_ctx: BvContext;
}> = (props) => {
  const { ent_id, bv_ctx } = props;
  const { editor } = bv_ctx;
  const { ecs } = editor;

  const renderable = ecs.get_compo(ent_id, BvRenderableCompo.type) as
    | BvRenderableCompo
    | undefined;

  if (!renderable) return null;

  let rendered = renderable.rendered;

  if (!rendered) {
    rendered = renderable.render({
      ent_id,
      bv_ctx,
    });
  }

  return rendered.node;
};

export const ContentRenderer: Component<{ bv_ctx: BvContext }> = (props) => {
  const { bv_ctx } = props;
  const content = bv_ctx.editor.content;

  createEffect(
    on(content.root.get, (ent) => {
      bv_ctx.editor_node.innerHTML = "";
    })
  );

  return <NodeRendererWrapper ent_id={content.root.get()!} bv_ctx={bv_ctx} />;
};
