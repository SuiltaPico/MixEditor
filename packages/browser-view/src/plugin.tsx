import { MEPlugin } from "@mixeditor/core";
import { BvSelectionContext } from "./selection";

export type BrowserViewExposed = ReturnType<
  ReturnType<typeof browser_view>["init"]
>;

export const browser_view = () => {
  let bv_selection_ctx!: BvSelectionContext;

  return {
    id: "browser_view",
    version: "0.0.1",
    meta: {
      name: "Browser View",
      description: "提供浏览器视图的功能。",
      author: "Mixeditor",
    },
    init(editor) {
      bv_selection_ctx = new BvSelectionContext(editor);
      editor.ent.register_domain("bv");

      return {
        bv_selection_ctx,
      };
    },
    dispose(editor) {
      editor.ent.unregister_domain("bv");
    },
  } satisfies MEPlugin;
};
