import { createSignal } from "@mixeditor/common";
import { MixEditor } from "@mixeditor/core";

/** 浏览器视图的 Selection 上下文。用于补充 MixEditor Selection 上下文的信息。 */
export class BvSelectionContext {
  ranges = createSignal<
    {
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[]
  >([]);

  constructor(private editor: MixEditor) {}
}
