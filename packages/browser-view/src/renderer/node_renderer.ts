import { Ent } from "@mixeditor/core";
import { createRoot } from "solid-js/types/server/reactive.js";
import { BvContext } from "../context";

export type RenderedDomNode = Node & {
  /** 渲染器对应的实体。 */
  me_ent?: Ent;
};

export type Rendered = {
  dispose: () => void;
  node: RenderedDomNode;
};

export type RenderedFactory = (props: {
  ent_id: string;
  bv_ctx: BvContext;
}) => Rendered;

/** 创建一个 solidjs 渲染器。 */
export function create_solidjs_rendered(
  component: (props: { ent_id: string; bv_ctx: BvContext }) => any
) {
  return (props: { ent_id: string; bv_ctx: BvContext }) => {
    let dispose!: Rendered["dispose"];
    let node!: Rendered["node"];

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
