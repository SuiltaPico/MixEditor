import { BvRenderableCompo } from "./renderable";

export * from "./renderable";

export interface CompoMapBvExtend {
  [BvRenderableCompo.type]: BvRenderableCompo;
}
