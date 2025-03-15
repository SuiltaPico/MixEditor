import { Compo } from "@mixeditor/core";

export class DocBoldCompo implements Compo {
  static type = "doc:bold" as const;
  get type() {
    return DocBoldCompo.type;
  }
}
