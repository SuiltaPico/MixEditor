import { MECompoBehaviorHandler } from "@mixeditor/core";

export const BvWrapCb = "bv:wrap";
/** 不允许异步。 */
export type BvWrapCompoBehavior = MECompoBehaviorHandler<
  {
    node: Node;
  },
  Node
>;