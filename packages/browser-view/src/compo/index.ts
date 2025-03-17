import { BvWrapCompoBehavior, BvWrapCb } from "./behavior/wrap";
import { BvRenderableCompo } from "./renderable";

export * from "./renderable";
export * from "./behavior/wrap";

export interface CompoMapBvExtend {
  [BvRenderableCompo.type]: BvRenderableCompo;
}

export interface CompoBehaviorMapBvExtend {
  [BvWrapCb]: BvWrapCompoBehavior;
}
