import { EntBehaviorMapExtend, EntDomainCtxMapExtend } from "./ent";
import { DocCompoBehaviorMapExtend, PipeEventMapExtend } from "./pipe";

export * from "./ent";
export * from "./pipe";
export * from "./plugin";

declare module "@mixeditor/core" {
  interface MEEntBehaviorMap extends EntBehaviorMapExtend {}
  interface MEEntDomainCtxMap extends EntDomainCtxMapExtend {}
  interface MEPipeEventMap extends PipeEventMapExtend {}
  interface MECompoBehaviorMap extends DocCompoBehaviorMapExtend {}
}
