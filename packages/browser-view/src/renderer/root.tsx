import { Component, createResource, createRoot } from "solid-js";
import { NodeRendererWrapper } from "./content";
import { Ent, RootEnt } from "@mixeditor/core";
import { BvContext } from "../context";
import { Rendered, RenderedDomNode } from "./node_renderer";

/** 文档渲染器。
 * 负责渲染文档节点。
 */
export const RootRenderer: Component<{
  ent: Ent;
  bv_ctx: BvContext;
}> = (props) => {
  const editor = props.bv_ctx.editor;
  const { ent: ent_ctx } = editor;

  const [chilren] = createResource(() => {
    return ent_ctx.exec_behavior(props.ent, "tree:children", {});
  });

  return (
    <div class="_root">
      {chilren()?.map((child) => {
        return <NodeRendererWrapper ent={child} bv_ctx={props.bv_ctx} />;
      })}
    </div>
  );
};
