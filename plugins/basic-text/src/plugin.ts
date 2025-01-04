import { BrowserViewPluginResult } from "@mixeditor/browser-view";
import { MixEditorPluginContext, TransferDataObject } from "@mixeditor/core";
import { TextNode, TextRenderer } from "./nodes/Text";

export function text() {
  return {
    id: "text",
    init: async (ctx: MixEditorPluginContext) => {
      const editor = ctx.editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      editor.saver.register_loader("text", (tdo) => {
        return new TextNode(tdo.data.text);
      });

      editor.node_manager.register_behavior("text", "save", (_, node) => {
        const text_node = node as TextNode;
        return {
          type: "text",
          data: {
            text: text_node.text.get(),
          },
        } satisfies TransferDataObject;
      });

      // 注册渲染器
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("text", TextRenderer);
    },
    dispose: () => {},
  };
}
