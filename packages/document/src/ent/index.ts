import { MixEditor } from "@mixeditor/core";
import { register_ParagraphEnt } from "./paragraph";
import { register_TextEnt } from "./text";
import { register_RootEnt_doc_extend } from "./root";

export * from "./paragraph";
export * from "./text";
export * from "./root";

export const register_ents = (editor: MixEditor) => {
  const disposers = [
    register_ParagraphEnt(editor),
    register_TextEnt(editor),
    register_RootEnt_doc_extend(editor),
  ];
  return () => {
    disposers.forEach((disposer) => disposer());
  };
};
