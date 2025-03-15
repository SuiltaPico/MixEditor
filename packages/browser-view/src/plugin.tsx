import { MEPlugin } from "@mixeditor/core";
import { render } from "solid-js/web";
import { BvContext } from "./context";
import { register_RootEnt_bv_extend } from "./ent";
import { EditorRenderer } from "./renderer/framework/editor";

export type BrowserViewExposed = ReturnType<
  ReturnType<typeof BrowserViewPlugin>["init"]
>;

export const BrowserViewPlugin = (params: { mount_to: HTMLElement }) => {
  let dispose_render_root: (() => void) | undefined;

  return {
    id: "browser_view",
    version: "0.0.1",
    meta: {
      name: "Browser View",
      description: "提供浏览器视图的功能。",
      author: "Mixeditor",
    },
    init(editor) {
      register_RootEnt_bv_extend(editor);

      let bv_ctx = {
        editor,
      } as BvContext;

      dispose_render_root = render(
        () => <EditorRenderer {...bv_ctx} />,
        params.mount_to
      );

      return {
        bv_ctx,
      };
    },
    dispose(editor) {
      dispose_render_root?.();
    },
  } satisfies MEPlugin;
};
