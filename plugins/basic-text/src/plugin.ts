import { BrowserViewPluginResult } from "@mixeditor/browser-view";
import { MixEditorPluginContext, TransferDataObject } from "@mixeditor/core";
import { TextNode, TextRenderer } from "./nodes/Text";
import {
  ParagraphNode,
  ParagraphNodeTDO,
  ParagraphRenderer,
} from "./nodes/Paragraph";

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

export function paragraph() {
  return {
    id: "paragraph",
    init: async (ctx: MixEditorPluginContext) => {
      const editor = ctx.editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      editor.saver.register_loader("paragraph", async (_tdo) => {
        const tdo = _tdo as ParagraphNodeTDO;
        const children = await Promise.all(
          tdo.data.children.map((child) => editor.saver.load_node(child))
        );
        return new ParagraphNode(children);
      });

      editor.node_manager.register_behavior(
        "paragraph",
        "save",
        async (_, node) => {
          const paragraph_node = node as ParagraphNode;
          return {
            type: "paragraph",
            data: {
              children: await Promise.all(
                paragraph_node.children.map((child) =>
                  editor.node_manager.save(child)
                )
              ),
            },
          } satisfies ParagraphNodeTDO;
        }
      );

      // 注册渲染器
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("paragraph", ParagraphRenderer);
    },
    dispose: () => {},
  };
}
