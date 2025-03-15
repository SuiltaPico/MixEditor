import { Compo } from "@mixeditor/core";

export class DocItalicCompo implements Compo {
  static type = "doc:italic" as const;
  get type() {
    return DocItalicCompo.type;
  }
}
