import {
  GetCloneParamsCb,
  CreateCb,
  FromDtoDataCb,
  ToDtoDataCb,
  ToDtoDecision,
} from "../../../ecs";
import { MixEditor } from "../../mix_editor";

/**
 * 类型组件
 * 
 * 用于存储实体的类型信息
 */
export class TypeCompo {
  static readonly type = "core:type" as const;
  get type() {
    return TypeCompo.type;
  }

  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export interface TypeCompoCreateParams {
  value: string;
}

/** 类型组件传输对象结构定义 */
export type TypeCompoDTOData = string;

export function register_TypeCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TypeCompo.type, {
    [CreateCb]({ params }) {
      return new TypeCompo(params.value);
    },
    [ToDtoDataCb]({ it }) {
      const value = it.value;
      return ToDtoDecision.Done({ data: value });
    },
    [FromDtoDataCb]({ data: input }) {
      return { value: input as TypeCompoDTOData };
    },
    [GetCloneParamsCb]({ it }) {
      return { value: it.value };
    }
  });
}
