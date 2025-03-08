import { TextEnt, TextEntTDO } from "./model";

export * from "./model";

declare module "@mixeditor/core" {
  interface MEEntMap {
    text: TextEnt;
  }
  interface MEEntTDOMap {
    text: TextEntTDO;
  }
}
