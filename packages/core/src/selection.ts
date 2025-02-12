import { createSignal } from "@mixeditor/common";
import { MixEditor } from "./MixEditor";
import { Node } from "./node/Node";

/** 选择节点信息。 */
export type SelectedData = {
  node: Node;
  /** 子区域路径。 */
  child_path: number;
};

/** 折叠选择。 */
export type CollapsedSelected = {
  type: "collapsed";
  start: SelectedData;
};

/** 扩展选择。 */
export type ExtendedSelected = {
  type: "extended";
  start: SelectedData;
  end: SelectedData;
};

export type Selected = CollapsedSelected | ExtendedSelected;

/** 选择管理器。 */
export class Selection {
  selected = createSignal<Selected | undefined>(undefined);

  /** 获取选区。 */
  get_selected() {
    return this.selected.get();
  }

  /** 设置选区。 */
  set_selected(selected: Selected | undefined) {
    this.selected.set(selected);
  }

  /** 折叠选择。 */
  collapsed_select(selected: SelectedData) {
    this.selected.set({
      type: "collapsed",
      start: selected,
    });
  }

  /** 扩展选择。 */
  extended_select(start: SelectedData, end: SelectedData) {
    this.selected.set({
      type: "extended",
      start,
      end,
    });
  }

  /** 移动选择。 */
  move(direction: "next" | "prev") {
    const current = this.selected.get();
    if (!current) return;
    // 触发光标移动事件，会触发责任链以完成移动
    this.editor.event_manager.emit({
      type: "caret_move",
      direction,
    });
  }

  /** 扩展到指定位置。 */
  extend_to(position: SelectedData) {
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
