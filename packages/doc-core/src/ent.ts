import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import {
  CaretNavigateContext,
  CaretNavigateDecision,
} from "./pipe/caret_navigate";
import {
  DeleteFromCaretContext,
  DeleteFromCaretDecision,
} from "./pipe/delete_from_caret";

export interface EntBehaviorMapExtend {
  /** 获取子实体 */
  "doc:get_child": MEEntBehaviorHandler<{ index: number }, Ent>;
  /** 获取所有子实体 */
  "doc:get_children": MEEntBehaviorHandler<{}, Ent[]>;
  /** 获取指定索引的子实体 */
  "doc:get_child_at": MEEntBehaviorHandler<{ index: number }, Ent>;
  /** 获取子实体数量 */
  "doc:get_children_count": MEEntBehaviorHandler<{}, number>;

  /** 插入子实体 */
  "doc:insert_children": MEEntBehaviorHandler<
    {
      to: number;
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
}
