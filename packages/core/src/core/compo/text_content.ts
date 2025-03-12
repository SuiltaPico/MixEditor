import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { IChildEntityCompo } from "./child_ent";
import { CompoTDO, Ent } from "../../ecs";
import { MixEditor } from "../mix_editor";

/** 文本内容组件。代表一个实体的文本内容。 */
export class TextContentCompo implements IChildEntityCompo {
  static readonly type = "text_content" as const;
  get type() {
    return TextContentCompo.type;
  }

  content: WrappedSignal<string>;

  // ----- 实现 IChildEntityCompo 接口 -----
  size() {
    return this.content.get().length;
  }
  at(_: number) {
    return undefined;
  }

  constructor(content: string) {
    this.content = create_Signal(content, {
      equals: false,
    });
  }
}

export interface TextContentCompoTDO extends CompoTDO {
  content: string;
}

export function register_TextContentCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextContentCompo.type, {
    to_tdo: async ({ it }) => {
      return {
        type: TextContentCompo.type,
        content: it.content.get(),
      } satisfies TextContentCompoTDO;
    },
    from_tdo: async ({ input }) => {
      return new TextContentCompo((input as TextContentCompoTDO).content);
    },
  });
}
