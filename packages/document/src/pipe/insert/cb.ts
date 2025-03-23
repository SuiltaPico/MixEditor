import { MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { InsertContext, InsertDecision } from "./executor";

/** 文档插入行为。
 *
 * 若组件未实现此行为，则视为返回了 `InsertDecision.Allow({ rejected_from: 0, rejected_to: Number.MAX_SAFE_INTEGER })`。
 */
export const DocInsertCb = "doc:insert" as const;
export interface DocInsertCbMapExtend {
  [DocInsertCb]: MECompoBehaviorHandler<InsertContext, InsertDecision>;
}