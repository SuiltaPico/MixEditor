import {
  BrowserViewPluginResult,
  NodeRenderer,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  MixEditorPluginContext,
  Node,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    text: TextNode;
  }
}

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
}

export class TextNode implements Node {
  type = "text" as const;
  text: WrappedSignal<string>;
  constructor(text: string) {
    this.text = createSignal(text);
  }
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  const { node } = props;

  let container!: WithMixEditorNode<HTMLElement>;
  onMount(() => {
    container.mixed_node = node;
  });

  return (
    <span class="_text" ref={container}>
      {node.text.get()}
    </span>
  );
};

export function text() {
  return {
    id: "text",
    init: async (ctx: MixEditorPluginContext) => {
      const editor = ctx.editor;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );

      editor.saver.register_loader<TextNodeTDO>("text", (tdo) => {
        return new TextNode(tdo.content);
      });

      editor.node_manager.register_behaviors("text", {
        save: (_, node) => {
          return {
            type: "text",
            content: node.text.get(),
          } satisfies TextNodeTDO;
        },
        get_children_count: (_, node) => {
          return node.text.get().length;
        },
        slice: (_, node, start, end) => {
          return new TextNode(node.text.get().slice(start, end));
        },
        "bv:pointer_down": (_, node, event) => {
          
        },
      });

      // 注册渲染器
      const renderer_manager = browser_view_plugin.renderer_manager;
      renderer_manager.register("text", TextRenderer);
    },
    dispose: () => {},
  };
}
