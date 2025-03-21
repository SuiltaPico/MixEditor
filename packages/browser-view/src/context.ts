import { MixEditor } from "@mixeditor/core";

export class BvContext {

  constructor(
    public editor: MixEditor,
    public editor_node?: HTMLElement,
  ) {}
}

export interface BvDomainContext {
  node: HTMLElement;
  dispose: () => void;
}
