import { createSignal } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

/** 浏览器视图的 Selection。用于补充 MixEditor Selection 的信息。 */
export class BvSelection {
  start_caret = {
    x: createSignal(0),
    y: createSignal(0),
  };
  end_caret = {
    x: createSignal(0),
    y: createSignal(0),
  };

  constructor(private editor: MixEditor) {}
}
