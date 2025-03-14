import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { CaretNavigateContext, CaretNavigateDecision } from "./executor";
import { handle_default_caret_navigate } from "../../common/helpers";

export const DocCaretNavigateCb = "doc:caret_navigate" as const;
export interface DocCaretNavigateCbMapExtend {
  [DocCaretNavigateCb]: MECompoBehaviorHandler<
    CaretNavigateContext,
    CaretNavigateDecision
  >;
}

/** 注册文档光标导航行为。
 *
 * 为所有组件添加默认的光标导航行为。
 */
export function register_DocCaretNavigate(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [DocCaretNavigateCb]: handle_default_caret_navigate,
  });
}
