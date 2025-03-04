import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import {
  CaretNavigateContext,
  CaretNavigateDecision,
} from "./pipe/caret_navigate/";
import {
  CaretDeleteContext,
  CaretDeleteDecision,
} from "./pipe/delete/caret_delete";
import {
  RangeDeleteContext,
  RangeDeleteDecision,
} from "./pipe/delete/range_delete";
import { MergeEntContext, MergeEntDecision } from "./pipe/merge_ent";

/**
 * 扩展实体行为类型定义
 *
 * 定义文档编辑器特有的实体行为接口
 */
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
  "doc:get_length": MEEntBehaviorHandler<{}, number>;

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

/**
 * 扩展实体行为类型定义
 *
 * 定义文档编辑器特有的实体行为接口
 */
export interface EntDomainCtxMapExtend {
  doc: {
    parent: Ent;
  };
}
