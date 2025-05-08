import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  Compo,
  CreateCb,
  FromDtoDataCb,
  GetCloneParamsCb,
  MixEditor,
  ToDtoDataCb,
  ToDtoDecision,
} from "@mixeditor/core";
import {
  DocMergeCb,
  handle_merge_allow_when_same_with_cond_or_loose,
} from "../../../pipe";

export class DocHeadingCompo implements Compo {
  static type = "doc:heading" as const;
  get type() {
    return DocHeadingCompo.type;
  }

  level: WrappedSignal<number>;

  constructor(level: number) {
    this.level = create_Signal(level);
  }
}

/** 标题组件传输对象结构定义 */
export type DocHeadingCompoDTOData = number;

export function register_DocHeadingCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocHeadingCompo.type, {
    [CreateCb]({ params }) {
      return new DocHeadingCompo(params.level);
    },
    [ToDtoDataCb]({ it }) {
      return ToDtoDecision.Done({ data: it.level.get() });
    },
    [FromDtoDataCb]({ data }) {
      return { level: data as DocHeadingCompoDTOData };
    },
    [GetCloneParamsCb]({ it }) {
      return { level: it.level.get() };
    },
    [DocMergeCb]: handle_merge_allow_when_same_with_cond_or_loose(
      (host, src) => {
        return (
          (host as DocHeadingCompo).level.get() ===
          (src as DocHeadingCompo).level.get()
        );
      }
    ),
  });
}
