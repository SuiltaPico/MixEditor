import { create_Signal } from "@mixeditor/common";
import { IChildEntityCompo } from "./child_ent";

/** 子实体组件。代表一个实体的子实体。 */
export class TextContentCompo implements IChildEntityCompo {
  static readonly type = "text_content" as const;
  get type() {
    return TextContentCompo.type;
  }

  content = create_Signal<string>("");

  length() {
    return this.content.get().length;
  }
  at(index: number) {
    return undefined;
  }
}
