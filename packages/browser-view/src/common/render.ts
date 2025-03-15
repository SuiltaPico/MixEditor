import { Ent } from "@mixeditor/core";
import { createRoot } from "solid-js";
import { BvContext } from "../context";

/** 渲染结果的节点。 */
export type RenderedDomNode = Node & {
  /** 渲染器对应的实体。 */
  me_ent?: Ent;
};

/** 渲染结果 */
export type RenderResult = {
  /** 销毁函数。 */
  dispose: () => void;
  /** 渲染结果的节点。 */
  node: RenderedDomNode;
};

/** 渲染器 */
export type Renderer = (props: {
  ent_id: string;
  bv_ctx: BvContext;
}) => RenderResult;

/** 节点渲染器 */
export type NodeRenderer = (props: {
  ent_id: string;
  bv_ctx: BvContext;
}) => any;

/** 创建一个 solidjs 组件渲染器。 */
export function from_solidjs_compo(
  component: (props: { ent_id: string; bv_ctx: BvContext }) => any
) {
  return (props: { ent_id: string; bv_ctx: BvContext }) => {
    let dispose!: RenderResult["dispose"];
    let node!: RenderResult["node"];

    createRoot((d) => {
      dispose = d;
      node = component({
        ...props,
        ent_id: props.ent_id,
      }) as RenderedDomNode;
    });

    return {
      dispose,
      node,
    };
  };
}
