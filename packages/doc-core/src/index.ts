import { Ent } from "@mixeditor/core";
import { EntBehaviorMapExtend, EntDomainCtxMapExtend } from "./ent";
import { PipeEventMapExtend } from "./pipe";
import { SelectionMapExtend } from "./selection";

export * from "./ent";
export * from "./pipe";
export * from "./plugin";
export * from "./selection";

declare module "@mixeditor/core" {
  interface MEEntBehaviorMap extends EntBehaviorMapExtend {}
  interface MEEntDomainCtxMap extends EntDomainCtxMapExtend {}
  interface MEPipeEventMap extends PipeEventMapExtend {}
  interface MESelectionMap extends SelectionMapExtend {}
}
