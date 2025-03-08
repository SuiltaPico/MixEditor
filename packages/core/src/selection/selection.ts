import { create_Signal } from "@mixeditor/common";

export type SelectionMap = {};

/** 选择上下文。 */
export class SelectionCtx<TSelectionMap extends SelectionMap> {
  selection = create_Signal<TSelectionMap[keyof TSelectionMap] | undefined>(
    undefined
  );

  /** 获取选区。 */
  get_selection() {
    return this.selection.get();
  }

  /** 设置选区。 */
  set_selection(selection: TSelectionMap[keyof TSelectionMap] | undefined) {
    this.selection.set(selection as any);
  }

  /** 清除选区。 */
  clear() {
    this.selection.set(undefined);
  }

  constructor() {}
}
