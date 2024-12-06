import { createSignal } from "./common/signal";
import { MixEditor } from "./index";
import { BaseNode } from "./Node";

export type SelectedNodeInfo = {
  node: BaseNode;
  /** 子区域路径。 */
  child_path: number;
};
export type CollapsedSelected = {
  type: "collapsed";
  start: SelectedNodeInfo;
};

export type ExtendedSelected = {
  type: "extended";
  start: SelectedNodeInfo;
  end: SelectedNodeInfo;
};

export type Selected = CollapsedSelected | ExtendedSelected;

export class Selection {
  selected = createSignal<Selected | undefined>(undefined);

  collapsed_select(selected: SelectedNodeInfo) {
    this.selected.set({
      type: "collapsed",
      start: selected,
    });
  }

  extended_select(start: SelectedNodeInfo, end: SelectedNodeInfo) {
    this.selected.set({
      type: "extended",
      start,
      end,
    });
  }

  

  constructor(public editor: MixEditor) {}
}
