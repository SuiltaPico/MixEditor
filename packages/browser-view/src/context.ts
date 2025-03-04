import { MixEditor } from "@mixeditor/core";
import { BvSelectionContext } from "./selection";

export type BvContext = {
  editor: MixEditor;
  /** 浏览器视图的 Selection。 */
  selection_ctx: BvSelectionContext;
  /** 根节点。 */
  root_node: HTMLElement;
  /** 内容节点。 */
  content_node: HTMLElement;
};
