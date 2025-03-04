import { EntDomainCtxMapExtend } from "./ent";
import { PipeEventMapExtend } from "./pipe";

export * from "./plugin";
export * from "./pipe";

declare module "@mixeditor/core" {
  interface MEEntDomainCtxMap extends EntDomainCtxMapExtend {}
  interface MEPipeEventMap extends PipeEventMapExtend {}
}
