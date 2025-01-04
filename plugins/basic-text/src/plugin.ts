import { BrowserViewPluginResult } from "@mixeditor/browser-view";
import { MixEditorPluginContext } from "@mixeditor/core";
import { TextRenderer } from "./nodes/Text";

export function text() {
  return {
    id: "text",
    init: async (ctx: MixEditorPluginContext) => {
      const editor = ctx.editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("text", TextRenderer);
    },
    dispose: () => {},
  };
}
