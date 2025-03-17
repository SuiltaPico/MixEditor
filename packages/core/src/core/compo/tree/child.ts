import { IArrayLike } from "../../../common/object";
import { Compo, ToTdoCb, CompoBehaviorMap, CompoTDO, Ent } from "../../../ecs";
import { MECompoBehaviorHandler, MixEditor } from "../../mix_editor";
import { RouteCompo } from "../basic/route";

/**
 * 子实体来源记录组件
 *
 * 记录子实体的来源组件类型，不直接管理子实体列表
 * 通过关联的源组件（实现IChildEntityCompo接口）管理具体子实体
 */
export class ChildCompo extends RouteCompo {
  static readonly type = "child" as const;
  get type() {
    return ChildCompo.type;
  }
}

/** 子实体组件传输对象结构定义 */
export interface ChildCompoTDO extends CompoTDO {
  /** 来源组件的类型名称（如"children_ent_array"） */
  src: string;
}

/** 注册子实体组件到编辑器系统 */
export function register_ChildCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ChildCompo.type, {
    /** 序列化组件为传输对象 */
    async [ToTdoCb]({ it }) {
      const src = it.src.get();
      return {
        type: ChildCompo.type,
        src,
      };
    },
    /** 从传输对象反序列化组件 */
    from_tdo({ input }) {
      return new ChildCompo((input as ChildCompoTDO).src);
    },
  });
}

/**
 * 子实体容器组件接口
 *
 * 需要同时实现组件和类数组接口
 * 符合此接口的组件可以作为子实体源（如ChildEntArrayCompo）
 */
export type IChildCompo = IArrayLike<string> & Compo;

/**
 * 默认子实体索引查找实现：线性遍历查找实体ID
 * @param container 子实体容器组件实例
 * @param target_ent_id 要查找的目标实体
 */
export function find_child_ent_index_default(
  container: IChildCompo,
  target_ent_id: string
) {
  const index = container.count();
  for (let i = 0; i < index; i++) {
    const child = container.at(i);
    if (child === target_ent_id) return i;
  }
  return -1;
}

export const TreeChildInsert = "tree:child.insert" as const;
export const TreeChildDelete = "tree:child.delete" as const;

export interface ChildCompoBehaviorMap extends CompoBehaviorMap<MixEditor> {
  [TreeChildInsert]: MECompoBehaviorHandler<
    {
      index: number;
      items: string[];
    },
    void
  >;
  [TreeChildDelete]: MECompoBehaviorHandler<
    {
      start: number;
      end: number;
    },
    string[]
  >;
}
