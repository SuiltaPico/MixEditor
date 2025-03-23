import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { MergeContext, MergeDecision } from "./executor";
import { handle_default_merge } from "./preset";

/** 文档合并行为。
 *
 * 若组件未实现此行为，则视为返回了 `MergeDecision.Allow`。
 */
export const DocMergeCb = "doc:merge" as const;
export interface DocMergeCbMapExtend {
  [DocMergeCb]: MECompoBehaviorHandler<MergeContext, MergeDecision>;
}

export function register_DocMergeCb(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [DocMergeCb]: handle_default_merge,
  });
}
