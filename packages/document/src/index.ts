import { DocCompoMap } from "./compo";
import { ParagraphEntInitPipeEvent, ParagraphEntInitPipeId } from "./ent";
import { CodeBlockEntInitPipeEvent, CodeBlockEntInitPipeId } from "./ent/code_block";
import { TextEntInitPipeId, TextEntInitPipeEvent } from "./ent/text";
import { DocCompoBehaviorMapExtend, DocPipeEventMapExtend } from "./pipe";

export * from "./ent";
export * from "./pipe";
export * from "./plugin";
export * from "./compo";

declare module "@mixeditor/core" {
  interface MEPipeEventMap extends DocPipeEventMapExtend {
    [TextEntInitPipeId]: TextEntInitPipeEvent;
    [ParagraphEntInitPipeId]: ParagraphEntInitPipeEvent;
    [CodeBlockEntInitPipeId]: CodeBlockEntInitPipeEvent;
  }
  interface MECompoBehaviorMap extends DocCompoBehaviorMapExtend {}
  interface MECompoMap extends DocCompoMap {}
}
