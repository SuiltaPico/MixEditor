import { MEPlugin, MixEditor } from "@mixeditor/core";
import { register_ents } from "./ent";

export function DocBvBridgePlugin(): MEPlugin {
  return {
    id: "doc_bv_bridge",
    version: "0.0.1",
    meta: {
      name: "Doc Bv Bridge",
      description: "提供文档与浏览器视图的桥接功能。",
      author: "Mixeditor",
    },
    init(editor) {
      register_ents(editor);
    },
    dispose(editor) {},
  } satisfies MEPlugin;
}

export type DocBvBridgeExposed = ReturnType<
  ReturnType<typeof DocBvBridgePlugin>["init"]
>;
