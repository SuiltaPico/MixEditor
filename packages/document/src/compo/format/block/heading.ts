import {
  Compo,
  MixEditor,
  ToTdoCb,
  FromTdoCb,
  CompoTDO,
} from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";
import { create_Signal, WrappedSignal } from "@mixeditor/common";

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
export interface DocHeadingCompoTDO extends CompoTDO {
  level: number;
}

export function register_DocHeadingCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocHeadingCompo.type, {
    [ToTdoCb]({ it }) {
      return {
        type: DocHeadingCompo.type,
        level: it.level.get(),
      };
    },
    [FromTdoCb]({ input }) {
      return new DocHeadingCompo((input as DocHeadingCompoTDO).level);
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_heading = ecs.get_compo(ent_id, DocHeadingCompo.type);
      const src_heading = ecs.get_compo(src_id, DocHeadingCompo.type);

      if (ent_heading && src_heading) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
