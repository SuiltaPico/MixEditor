import { createSignal } from "@mixeditor/common";

export type SelectionMap = {}

/** 选择上下文。 */
export class SelectionCtx<TSelectionMap extends SelectionMap> {
  selected = createSignal<TSelectionMap[keyof TSelectionMap] | undefined>(
    undefined
  );

  /** 获取选区。 */
  get_selected() {
    return this.selected.get();
  }

  /** 设置选区。 */
  set_selected(selected: TSelectionMap[keyof TSelectionMap] | undefined) {
    this.selected.set(selected as any);
  }

  /** 清除选区。 */
  clear() {
    this.selected.set(undefined);
  }

  constructor() {}
}
