import { MEPlugin } from "@mixeditor/core";
import { register_pipes_and_compo_behaviors } from "./pipe";
import { register_ents } from "./ent";

export const DocumentPlugin: () => MEPlugin = () => {
  let disposers: ((() => void) | void)[] = [];
  return {
    id: "document",
    version: "0.0.1",
    meta: {
      name: "Document",
      description: "提供文档模型的核心功能，包括光标导航、内容删除等基础操作。",
      author: "Mixeditor",
    },
    init(editor) {
      disposers.push(
        register_pipes_and_compo_behaviors(editor),
        register_ents(editor)
      );
    },
    dispose(editor) {
      disposers.forEach((d) => d?.());
    },
  };
};
