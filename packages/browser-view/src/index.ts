import { MixEditorPlugin, MixEditorPluginContext, Node } from "@mixeditor/core";
import { Component } from "solid-js";
import { render } from "solid-js/web";

export type NodeRenderer = Component<{
  context: MixEditorPluginContext;
  node: Node;
}>;

export type RendererOption = {
  target_el: Element;
};

export const Renderer = (option: RendererOption): MixEditorPlugin => {
  const renderer_map = new Map<string, NodeRenderer>();
  let dispose_fn: (() => void) | null = null;

  const renderNode = (node: Node, context: MixEditorPluginContext) => {
    const renderer = renderer_map.get(node.type);
    if (!renderer) {
      console.warn(`No renderer found for node type: ${node.type}`);
      return;
    }

    if (dispose_fn) {
      dispose_fn();
    }

    dispose_fn = render(
      () => renderer({ context, node }), 
      option.target_el
    );
  };

  return {
    id: "renderer",
    init(context) {
      // 监听选中节点变化
      context.on("selection:change", (node) => {
        if (node) {
          renderNode(node, context);
        }
      });

      return {
        // 导出 API
        registerRenderer(type: string, renderer: NodeRenderer) {
          renderer_map.set(type, renderer);
        },
        
        unregisterRenderer(type: string) {
          renderer_map.delete(type);
        },

        render(node: Node) {
          renderNode(node, context);
        }
      };
    },
    dispose() {
      if (dispose_fn) {
        dispose_fn();
        dispose_fn = null;
      }
      renderer_map.clear();
    },
  } satisfies MixEditorPlugin;
};
