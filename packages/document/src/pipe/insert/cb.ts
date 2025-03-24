import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { InsertContext, InsertDecision } from "./executor";
import { handle_two_direction_scan_ent_for_insert } from "./default";

/** 文档插入行为。
 *
 * 若组件未实现此行为，则视为返回了 `InsertDecision.Allow({ rejected_from: 0, rejected_to: Number.MAX_SAFE_INTEGER })`。
 */
export const DocInsertCb = "doc:insert" as const;
export interface DocInsertCbMapExtend {
  [DocInsertCb]: MECompoBehaviorHandler<InsertContext, InsertDecision>;
}

/** 注册文档插入行为。
 *
 * 为所有组件添加默认的插入行为。
 */
export function register_DocInsertCb(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors("*", {
    [DocInsertCb]: handle_two_direction_scan_ent_for_insert,
  });
}
