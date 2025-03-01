import { Ent } from "@mixeditor/core";
import { EntBehaviorMapExtend } from "./ent";
import { PipeEventMapExtend } from "./pipe";
import { SelectionMapExtend } from "./selection";

export * from "./ent";
export * from "./plugin";
export * from "./selection";

declare module "@mixeditor/core" {
  interface MEEntBehaviorMap extends EntBehaviorMapExtend {}
  interface MEEntDomainCtxMap {
    doc: {
      parent: Ent;
    };
  }
  interface MEPipeEventMap extends PipeEventMapExtend {}
  interface MESelectionMap extends SelectionMapExtend {}
}
