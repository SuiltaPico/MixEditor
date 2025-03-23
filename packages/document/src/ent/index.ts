import { MixEditor } from "@mixeditor/core";
import { register_ParagraphEnt } from "./paragraph";
import { register_RootEnt_doc_extend } from "./root";
import { register_TextEnt } from "./text";
import { register_CodeBlockEnt } from "./code_block";

export * from "./code_block";
export * from "./paragraph";
export * from "./root";
export * from "./text";

export const register_ents = (editor: MixEditor) => {
  const disposers = [
    register_ParagraphEnt(editor),
    register_TextEnt(editor),
    register_CodeBlockEnt(editor),
    register_RootEnt_doc_extend(editor),
  ];
  return () => {
    disposers.forEach((disposer) => disposer?.());
  };
};
