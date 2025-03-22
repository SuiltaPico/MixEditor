import { CompoBehaviorMap } from "../../../ecs";
import { MixEditor, MECompoBehaviorHandler } from "../../mix_editor";

export const TreeChildrenInsertCb = "tree:children.insert" as const;
export const TreeChildrenDeleteCb = "tree:children.delete" as const;
export const TreeChildrenSplitOutCb = "tree:children.split_out" as const;
export const TreeChildrenSplitInCb = "tree:children.split_in" as const;

export interface ChildCompoBehaviorMap extends CompoBehaviorMap<MixEditor> {
  [TreeChildrenInsertCb]: MECompoBehaviorHandler<
    {
      index: number;
      items: string[];
    },
    void
  >;
  [TreeChildrenDeleteCb]: MECompoBehaviorHandler<
    {
      start: number;
      end: number;
    },
    string[]
  >;
  /** 删除自身 `index` 以右（包括 `index`）的部分，并自身的分割结果。
   *
   * 返回分割结果右侧子实体的ID。
   */
  [TreeChildrenSplitOutCb]: MECompoBehaviorHandler<
    {
      index: number;
    },
    any
  >;
  /** 将分割数据合并到自身。
   *
   * 数据由 `data` 参数给出。
   */
  [TreeChildrenSplitInCb]: MECompoBehaviorHandler<
    {
      data: any;
    },
    void
  >;
}
