import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { IChildCompo, TreeChildDelete, TreeChildInsert } from "./child";
import { CompoTDO, Ent, EntTDO } from "../../../ecs";
import { MixEditor } from "../../mix_editor";

/**
 * 子实体数组组件
 *
 * 实现IChildEntityCompo接口，管理实体的子实体列表
 * 作为子实体的实际存储容器，通过字符串数组存储子实体ID
 */
export class ArrayChildCompo implements IChildCompo {
  static readonly type = "array_child" as const;
  get type() {
    return ArrayChildCompo.type;
  }

  /** 存储子实体ID的信号包装数组 */
  children: WrappedSignal<string[]>;

  // ----- 实现 IChildEntityCompo 接口 -----
  count() {
    return this.children.get().length;
  }
  at(index: number) {
    return this.children.get()[index];
  }
  index_of(item: string) {
    return this.children.get().indexOf(item);
  }

  /**
   * 创建子实体数组组件实例
   * @param children 初始子实体ID数组
   */
  constructor(children: string[]) {
    this.children = create_Signal(children);
  }
}

/** 子实体数组组件传输对象结构定义 */
export interface ArrayChildCompoTDO extends CompoTDO {
  /** 子实体ID列表 */
  children: string[];
}

export function register_ArrayChildCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ArrayChildCompo.type, {
    /** 序列化组件为传输对象 */
    to_tdo({ it, save_with }) {
      const children = it.children.get();
      save_with(children);
      return {
        type: ArrayChildCompo.type,
        children: children,
      } satisfies ArrayChildCompoTDO;
    },
    /** 从传输对象反序列化组件 */
    from_tdo({ input }) {
      return new ArrayChildCompo((input as ArrayChildCompoTDO).children);
    },
    [TreeChildInsert]: ({ it, index, items }) => {
      const children = it.children.get();
      children.splice(index, 0, ...items);
      it.children.set(children);
    },
    [TreeChildDelete]: ({ it, start, end }) => {
      const children = it.children.get();
      const deleted = children.splice(start, end - start + 1);
      it.children.set(children);
      return deleted;
    },
  });
}
