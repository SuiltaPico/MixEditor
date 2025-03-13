import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { IArrayLike } from "../../../common/object";
import { Compo, CompoTDO } from "../../../ecs";
import { MixEditor } from "../../mix_editor";

/**
 * 父实体记录组件
 *
 * 记录当前实体的父实体ID，与 ChildEntCompo 配合使用
 * 通过信号量实现父子关系的动态更新
 */
export class ParentEntCompo implements Compo {
  static readonly type = "parent_ent" as const;
  get type() {
    return ParentEntCompo.type;
  }

  /** 父实体ID的信号包装 */
  parent_id: WrappedSignal<string | undefined>;

  constructor(parent_id: string | undefined) {
    this.parent_id = create_Signal(parent_id);
  }
}

/** 父实体组件传输对象结构定义 */
export interface ParentEntCompoTDO extends CompoTDO {
  parent: string | undefined;
}

export function register_ParentEntCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ParentEntCompo.type, {
    to_tdo({ it, save_with }) {
      const parent_id = it.parent_id.get();
      if (parent_id) {
        save_with([parent_id]);
      }
      return {
        type: ParentEntCompo.type,
        parent: parent_id,
      } satisfies ParentEntCompoTDO;
    },
    from_tdo({ input }) {
      return new ParentEntCompo((input as ParentEntCompoTDO).parent);
    },
  });
}

/**
 * 父实体源接口
 *
 * 符合此接口的组件可以作为父实体关系的来源
 * 需要同时实现组件和类数组接口
 */
export type IParentEntityCompo = IArrayLike<string> & Compo;
