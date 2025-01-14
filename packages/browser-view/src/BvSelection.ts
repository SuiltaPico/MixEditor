import { createSignal } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

/** 浏览器视图的 Selection。用于补充 MixEditor Selection 的信息。 */
export class BvSelection {
  /** 光标高度 */
  caret_height = createSignal(0);
  
  constructor(private editor: MixEditor) {}
}
