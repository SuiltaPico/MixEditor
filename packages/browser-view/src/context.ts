import { MixEditor } from "@mixeditor/core";

export interface BvContext {
  editor: MixEditor;
  /** 根节点。 */
  editor_node: HTMLElement;
}

export interface BvDomainContext {
  node: HTMLElement;
  dispose: () => void;
}
