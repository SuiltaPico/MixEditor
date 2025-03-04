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
  ent: Ent;
  bv_ctx: BvContext;
}> = (props) => {
  const { ent, bv_ctx } = props;
  const { editor } = bv_ctx;

  let bv_domain_ctx = editor.ent.get_domain_ctx(ent, "bv");
  if (!bv_domain_ctx) {
    bv_domain_ctx = {} as BvDomainContext;
  }

  // 使用节点渲染器渲染节点
  let rendered: Rendered =
    (editor.ent.exec_behavior(ent, "bv:renderer", {
      bv_ctx,
    }) as Rendered) ?? default_renderer();

  bv_domain_ctx.node = rendered.node;
  bv_domain_ctx.dispose = rendered.dispose;

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

  return <NodeRendererWrapper ent={content.root.get()} bv_ctx={bv_ctx} />;
};
