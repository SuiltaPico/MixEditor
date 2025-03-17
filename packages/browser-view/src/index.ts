import { CompoBehaviorMapBvExtend, CompoMapBvExtend } from "./compo";
import { PipeEventMapExtend } from "./pipe";

export * from "./common";
export * from "./compo";
export * from "./pipe";
export * from "./plugin";
export * from "./renderer";

declare module "@mixeditor/core" {
  interface MEPipeEventMap extends PipeEventMapExtend {}
  interface MECompoMap extends CompoMapBvExtend {}
  interface MECompoBehaviorMap extends CompoBehaviorMapBvExtend {}
}
