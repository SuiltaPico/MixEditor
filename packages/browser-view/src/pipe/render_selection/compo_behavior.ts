import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import {
  BvRenderSelectionContext,
  BvRenderSelectionDecision,
} from "./executor";

export const BvRenderSelectionCb = "bv:render_selection" as const;
export interface BvRenderSelectionCbMapExtend {
  [BvRenderSelectionCb]: MECompoBehaviorHandler<
    BvRenderSelectionContext,
    BvRenderSelectionDecision
  >;
}

/** 注册文档光标导航行为。
 *
 * 为所有组件添加默认的光标导航行为。
 */
export function register_BvRenderSelection(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [BvRenderSelectionCb]: handle_default_render_selection,
  });
}
