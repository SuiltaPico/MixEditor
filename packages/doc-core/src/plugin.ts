import { Plugin } from "@mixeditor/core";
import { register_pipes } from "./pipe";

export const DocCorePlugin: Plugin = {
  id: "doc-core",
  version: "0.0.1",
  meta: {
    name: "document core",
    description: "core of document",
    author: "Mixeditor",
  },
  init(editor) {
    editor.ent.register_domain("doc");
    register_pipes(editor);
  },
  dispose(editor) {
    editor.ent.unregister_domain("doc");
  },
};
