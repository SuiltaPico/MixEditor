import { TextEntInitPipeId, TextEntInitPipeEvent } from "./ent/text";
import { DocCompoBehaviorMapExtend, PipeEventMapExtend } from "./pipe";

export * from "./ent";
export * from "./pipe";
export * from "./plugin";

declare module "@mixeditor/core" {
  interface MEPipeEventMap extends PipeEventMapExtend {
    [TextEntInitPipeId]: TextEntInitPipeEvent;
  }
  interface MECompoBehaviorMap extends DocCompoBehaviorMapExtend {}
}
