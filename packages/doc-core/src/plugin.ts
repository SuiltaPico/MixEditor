import { MEPlugin } from "@mixeditor/core";
import { register_pipes } from "./pipe";

export const DocCorePlugin: MEPlugin = {
  id: "doc-core",
  version: "0.0.1",
  meta: {
    name: "Document Core",
    description: "提供文档模型的核心功能，包括光标导航、内容删除等基础操作。",
    author: "Mixeditor",
  },
  init(editor) {
    editor.ent.register_domain("doc");
    register_pipes(editor);
  },
  dispose(editor) {
    editor.ent.unregister_domain("doc");
    // 清理管道注册（假设框架支持管道注销）
    editor.pipe.delete_pipe("doc:caret_navigate");
    editor.pipe.delete_pipe("doc:directed_delete");
  },
};
