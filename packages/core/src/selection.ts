import { createSignal } from "@mixeditor/common";
import { MixEditor } from "./MixEditor";
import { Node } from "./node/Node";

export type SelectedNodeInfo = {
  node: Node;
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

  extend_to(position: SelectedNodeInfo) {
    const current = this.selected.get();
    if (!current) {
      // 如果当前没有选择,创建一个折叠选择
      this.collapsed_select(position);
      return;
    }
    // 不管当前是折叠还是扩展选择,都使用原始起点和新位置创建扩展选择
    this.extended_select(current.start, position);
  }

  constructor(public editor: MixEditor) {}
}
