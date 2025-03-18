import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import {
  CaretDeleteContext,
  CaretDeleteDecision,
  RangeDeleteContext,
  RangeDeleteDecision,
} from ".";
import {
  handle_default_caret_delete,
  handle_default_range_delete,
} from "./default";

export const DocCaretDeleteCb = "doc:caret_delete" as const;
export const DocRangeDeleteCb = "doc:range_delete" as const;
export interface DocDeleteCbMapExtend {
  [DocCaretDeleteCb]: MECompoBehaviorHandler<
    CaretDeleteContext,
    CaretDeleteDecision
  >;
  [DocRangeDeleteCb]: MECompoBehaviorHandler<
    RangeDeleteContext,
    RangeDeleteDecision
  >;
}

/** 注册文档光标导航行为。
 *
 * 为所有组件添加默认的光标导航行为。
 */
export function register_DocCaretDelete(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [DocCaretDeleteCb]: handle_default_caret_delete,
    [DocRangeDeleteCb]: handle_default_range_delete,
  });
}
