import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  GetCloneParamsCb,
  CreateCb,
  FromDtoDataCb,
  ToDtoDataCb,
  ToDtoDecision,
} from "../../../ecs";
import { MixEditor } from "../../mix_editor";
import {
  TreeDeleteChildrenCb,
  TreeInsertChildrenCb,
  TreeSplitInCb,
  TreeSplitOutCb,
} from "./cb";
import { IChildCompo } from "./child";
import { set_children_parent_refs } from "../../../common";

/**
 * 子实体数组组件
 *
 * 实现IChildEntityCompo接口，管理实体的子实体列表
 * 作为子实体的实际存储容器，通过字符串数组存储子实体ID
 */
export class EntChildCompo implements IChildCompo {
  static readonly type = "tree:ent_child" as const;
  get type() {
    return EntChildCompo.type;
  }

  /** 存储子实体ID的信号包装数组 */
  children: WrappedSignal<string[]>;

  // ----- 实现 IChildEntityCompo 接口 -----
  is_leaf() {
    return false;
  }
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

export interface EntChildCompoCreateParams {
  children: string[];
}

/** 子实体数组组件传输对象结构定义 */
export type EntChildCompoDTOData = string[];

export function register_EntChildCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(EntChildCompo.type, {
    [CreateCb]({ params }) {
      return new EntChildCompo(params.children);
    },
    [ToDtoDataCb]({ it, save_with }) {
      const children = it.children.get();
      save_with(children);
      return ToDtoDecision.Done({ data: children });
    },
    [FromDtoDataCb]({ data: input }) {
      return { children: input as EntChildCompoDTOData };
    },
    [GetCloneParamsCb]({ it }) {
      return { children: it.children.get() };
    },
    [TreeInsertChildrenCb]({ it, index, items, parent_id }) {
      const children = it.children.get();
      set_children_parent_refs(ecs, items, parent_id);
      children.splice(index, 0, ...items);
      it.children.set(children);
      return items.length;
    },
    [TreeDeleteChildrenCb]({ it, start, end }) {
      const children = it.children.get();
      const deleted = children.splice(start, end - start);
      it.children.set(children);
      return deleted;
    },
    [TreeSplitOutCb]({ it, index }) {
      const children = it.children.get();
      const left = children.slice(0, index);
      const right = children.slice(index);
      it.children.set(left);
      return right;
    },
    [TreeSplitInCb]({ it, data }) {
      const children = it.children.get();
      children.push(...data);
      it.children.set(children);
    },
  });
}
