import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  Compo,
  CreateCb,
  FromTdoDataCb,
  GetCloneParamsCb,
  MixEditor,
  ToTdoDataCb,
  ToTdoDecision,
} from "@mixeditor/core";
import {
  DocMergeCb,
  handle_merge_allow_when_same_with_cond_or_loose,
} from "../../../pipe";

export interface DocAlignMap {
  left: "start";
  center: "center";
  right: "end";
  justify: "justify";
}

export type DocAlignType = keyof DocAlignMap;

export class DocAlignCompo implements Compo {
  static type = "doc:align" as const;
  get type() {
    return DocAlignCompo.type;
  }

  to: WrappedSignal<DocAlignType>;

  constructor(to: DocAlignType) {
    this.to = create_Signal(to);
  }
}

/** 标题组件传输对象结构定义 */
export type DocAlignCompoTDOData = DocAlignType;

export function register_DocAlignCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocAlignCompo.type, {
    [CreateCb]({ params }) {
      return new DocAlignCompo(params.to);
    },
    [ToTdoDataCb]({ it }) {
      return ToTdoDecision.Done({ data: it.to.get() });
    },
    [FromTdoDataCb]({ data }) {
      return { to: data as DocAlignType };
    },
    [GetCloneParamsCb]({ it }) {
      return { to: it.to.get() };
    },
    [DocMergeCb]: handle_merge_allow_when_same_with_cond_or_loose(
      (host, src) => {
        return (
          (host as DocAlignCompo).to.get() === (src as DocAlignCompo).to.get()
        );
      }
    ),
  });
}
