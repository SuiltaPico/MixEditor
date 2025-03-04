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

/** 创建一个 solidjs 渲染器。 */
export function create_solidjs_rendered(
  component: (props: { ent: Ent; bv_ctx: BvContext }) => any
) {
  return (props: { item: Ent; bv_ctx: BvContext }) => {
    let dispose!: Rendered["dispose"];
    let node!: Rendered["node"];

    createRoot((d) => {
      dispose = d;
      node = component({
        ...props,
        ent: props.item,
      }) as RenderedDomNode;
    });

    return {
      dispose,
      node,
    };
  };
}
