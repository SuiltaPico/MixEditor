import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import {
  CaretNavigateContext,
  CaretNavigateDecision,
} from "./pipe/caret_navigate";
import {
  DeleteFromCaretContext,
  DeleteFromCaretDecision,
} from "./pipe/delete/delete_from_caret";
import { DeleteRangeDecision, DeleteRangeContext } from "./pipe/delete/delete_range";
import { MergeEntDecision, MergeEntContext } from "./pipe/merge_ent";

export interface EntBehaviorMapExtend {
  /** 获取子实体 */
  "doc:get_child": MEEntBehaviorHandler<{ index: number }, Ent>;
  /** 获取所有子实体 */
  "doc:get_children": MEEntBehaviorHandler<{}, Ent[]>;
  /** 获取指定索引的子实体 */
  "doc:get_child_at": MEEntBehaviorHandler<{ index: number }, Ent>;
  /** 获取子实体的索引 */
  "doc:index_of_child": MEEntBehaviorHandler<
    {
      child: Ent;
    },
    number
  >;
  /** 获取子实体数量 */
  "doc:get_children_count": MEEntBehaviorHandler<{}, number>;

  /** 插入子实体 */
  "doc:insert_children": MEEntBehaviorHandler<
    {
      index: number;
      children: Ent[];
    },
    void
  >;
  /** 移除子实体 */
  "doc:remove_children": MEEntBehaviorHandler<
    {
      from: number;
      to: number;
    },
    void
  >;

  /** 处理光标导航 */
  "doc:handle_caret_navigate": MEEntBehaviorHandler<
    CaretNavigateContext,
    CaretNavigateDecision
  >;
  /** 处理从光标位置删除 */
  "doc:handle_delete_from_caret": MEEntBehaviorHandler<
    DeleteFromCaretContext,
    DeleteFromCaretDecision
  >;
  /** 处理从光标位置删除 */
  "doc:handle_delete_range": MEEntBehaviorHandler<
    DeleteRangeContext,
    DeleteRangeDecision
  >;
  /** 处理合并实体 */
  "doc:merge_ent": MEEntBehaviorHandler<MergeEntContext, MergeEntDecision>;
}
