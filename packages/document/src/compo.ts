import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import {
  CaretNavigateContext,
  CaretNavigateDecision,
} from "./pipe/caret_navigate";
import {
  CaretDeleteContext,
  CaretDeleteDecision,
} from "./pipe/delete/caret_delete";
import {
  RangeDeleteContext,
  RangeDeleteDecision,
} from "./pipe/delete/range_delete";
import { MergeEntContext, MergeEntDecision } from "./pipe/merge/merge_ent";

/**
 * 扩展实体行为类型定义
 *
 * 定义文档编辑器特有的实体行为接口
 */
export interface EntBehaviorMapExtend {
  /** 处理光标导航 */
  "doc:handle_caret_navigate": MEEntBehaviorHandler<
    CaretNavigateContext,
    CaretNavigateDecision
  >;
  /** 处理从光标位置删除 */
  "doc:handle_delete_from_caret": MEEntBehaviorHandler<
    CaretDeleteContext,
    CaretDeleteDecision
  >;
  /** 处理范围删除行为 */
  "doc:handle_delete_range": MEEntBehaviorHandler<
    RangeDeleteContext,
    RangeDeleteDecision
  >;
  /** 处理实体合并行为 */
  "doc:merge_ent": MEEntBehaviorHandler<MergeEntContext, MergeEntDecision>;
}