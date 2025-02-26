import { createSignal } from "@mixeditor/common";

/** 选择上下文。 */
export class SelectionCtx<TSelectionMap extends Record<string, any>> {
  selected = createSignal<TSelectionMap[string] | undefined>(undefined);

  /** 获取选区。 */
  get_selected() {
    return this.selected.get();
  }

  /** 设置选区。 */
  set_selected(selected: TSelectionMap[string] | undefined) {
    this.selected.set(selected);
  }

  /** 清除选区。 */
  clear() {
    this.selected.set(undefined);
  }

  constructor() {}
}
