import { CompoBehaviorMap } from "../../../ecs";
import { MixEditor, MECompoBehaviorHandler } from "../../mix_editor";

export const TreeInsertChildrenCb = "tree:children.insert" as const;
export const TreeDeleteChildrenCb = "tree:children.delete" as const;
export const TreeSplitOutCb = "tree:split_out" as const;
export const TreeSplitInCb = "tree:split_in" as const;

export interface ChildCompoBehaviorMap extends CompoBehaviorMap<MixEditor> {
  [TreeInsertChildrenCb]: MECompoBehaviorHandler<
    {
      index: number;
      items: string[];
    },
    number
  >;
  [TreeDeleteChildrenCb]: MECompoBehaviorHandler<
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
  [TreeSplitOutCb]: MECompoBehaviorHandler<
    {
      index: number;
    },
    any
  >;
  /** 将分割数据合并到自身。
   *
   * 数据由 `data` 参数给出。
   */
  [TreeSplitInCb]: MECompoBehaviorHandler<
    {
      data: any;
    },
    void
  >;
}
