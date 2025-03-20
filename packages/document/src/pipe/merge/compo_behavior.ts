import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { MergeContext, MergeDecision } from "./executor";
import { handle_default_merge } from "./default";

export const DocMergeCb = "doc:merge" as const;
export interface DocMergeCbMapExtend {
  [DocMergeCb]: MECompoBehaviorHandler<MergeContext, MergeDecision>;
}

/** 注册文档光标导航行为。
 *
 * 为所有组件添加默认的光标导航行为。
 */
export function register_DocMerge(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [DocMergeCb]: handle_default_merge,
  });
}
