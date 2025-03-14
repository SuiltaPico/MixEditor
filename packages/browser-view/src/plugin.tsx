import { MEPlugin } from "@mixeditor/core";
import { RootRenderer } from "./renderer/root";
import { create_solidjs_rendered } from "./renderer/node_renderer";
import { BvContext } from "./context";
import { render } from "solid-js/web";
import { EditorRenderer } from "./renderer/editor";

export type BrowserViewExposed = ReturnType<
  ReturnType<typeof browser_view>["init"]
>;

export const browser_view = (params: { mount_to: HTMLElement }) => {
  let dispose_render_root: (() => void) | undefined;
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
