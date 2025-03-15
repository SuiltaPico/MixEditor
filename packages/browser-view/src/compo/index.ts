import { BvChildPositionCompo } from "./child_position";
import { BvRenderableCompo } from "./renderable";

export * from "./renderable";
export * from "./child_position";
export * from "./pointer";

export interface CompoMapBvExtend {
  [BvRenderableCompo.type]: BvRenderableCompo;
  [BvChildPositionCompo.type]: BvChildPositionCompo;
}
