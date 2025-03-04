import { MEPlugin } from "@mixeditor/core";
import { RootRenderer } from "./renderer/root";
import { create_solidjs_rendered } from "./renderer/node_renderer";
import { BvContext } from "./context";

export type BrowserViewExposed = ReturnType<
  ReturnType<typeof browser_view>["init"]
>;

export const browser_view = () => {
  let bv_ctx;

  return {
    id: "browser_view",
    version: "0.0.1",
    meta: {
      name: "Browser View",
      description: "提供浏览器视图的功能。",
      author: "Mixeditor",
    },
    init(editor) {
      let bv_ctx = {
        editor,
      } as BvContext;

      editor.ent.register_domain("bv");

      editor.ent.register_handler(
        "root",
        "bv:renderer",
        create_solidjs_rendered(RootRenderer)
      );

      return {};
    },
    dispose(editor) {
      editor.ent.unregister_domain("bv");
    },
  } satisfies MEPlugin;
};
