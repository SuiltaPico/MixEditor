import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { IArrayLike } from "../../../common/object";
import {
  GetCloneParamsCb,
  Compo,
  CompoTDO,
  CreateCb,
  FromTdoDataCb,
  ToTdoDataCb,
  ToTdoDecision,
} from "../../../ecs";
import { MixEditor } from "../../mix_editor";
import { TreeChildrenSplitInCb, TreeChildrenSplitOutCb } from "./cb";

/**
 * 父实体记录组件
 *
 * 记录当前实体的父实体ID，与 ChildEntCompo 配合使用
 * 通过信号量实现父子关系的动态更新
 */
export class ParentCompo implements Compo {
  static readonly type = "tree:parent" as const;
  get type() {
    return ParentCompo.type;
  }

  /** 父实体ID的信号包装 */
  parent_id: WrappedSignal<string | undefined>;

  constructor(parent_id: string | undefined) {
    this.parent_id = create_Signal(parent_id);
  }
}

/** 父实体组件传输对象结构定义 */
export type ParentEntCompoTDOData = string | undefined;

export interface ParentCompoCreateParams {
  parent: string | undefined;
}

export function register_ParentEntCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ParentCompo.type, {
    [CreateCb]({ params }) {
      return new ParentCompo(params.parent);
    },
    [ToTdoDataCb]({ it, save_with }) {
      const parent_id = it.parent_id.get();
      if (parent_id) {
        save_with([parent_id]);
      }
      return ToTdoDecision.Done({ data: parent_id });
    },
    [FromTdoDataCb]({ data: input }) {
      return { parent: input as ParentEntCompoTDOData };
    },
    [GetCloneParamsCb]({ it }) {
      return { parent: it.parent_id.get() };
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
