import { Ent } from "../../ecs";
import { MEEntBehaviorHandler } from "../mix_editor";

export interface TreeEntBehaviorMap {
  /** 获取所有子实体 */
  "tree:children": MEEntBehaviorHandler<{}, Ent[]>;
  /** 获取指定索引的子实体 */
  "tree:child_at": MEEntBehaviorHandler<{ index: number }, Ent>;
  /** 获取子实体的索引 */
  "tree:index_of_child": MEEntBehaviorHandler<
    {
      child: Ent;
    },
    number
  >;
  /** 获取子实体数量 */
  "tree:length": MEEntBehaviorHandler<{}, number>;

  /** 插入子实体 */
  "tree:insert_children": MEEntBehaviorHandler<
    {
      index: number;
      children: Ent[];
    },
    void
  >;
  /** 移除子实体 */
  "tree:delete_children": MEEntBehaviorHandler<
    {
      from: number;
      to: number;
    },
    Ent[]
  >;
}
