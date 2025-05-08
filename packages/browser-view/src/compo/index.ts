import { BvWrapCompoBehavior, BvWrapCb } from "./behavior/wrap";
import { BvRenderableCompo } from "./renderable";

export * from "./renderable";
export * from "./behavior/wrap";
export * from "./utils";

export interface CompoMapBvExtend {
  [BvRenderableCompo.type]: {
    compo: BvRenderableCompo;
    create_params: {};
  };
}

export interface CompoBehaviorMapBvExtend {
  [BvWrapCb]: BvWrapCompoBehavior;
}
