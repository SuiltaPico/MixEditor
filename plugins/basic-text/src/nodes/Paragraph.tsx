import {
  BrowserViewPluginResult,
  NodeRenderer,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  AnyTDO,
  MixEditorPluginContext,
  Node,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    paragraph: ParagraphNode;
  }
}

export interface ParagraphNodeTDO extends TransferDataObject {
  type: "paragraph";
  children: AnyTDO[];
}

export class ParagraphNode implements Node {
  type = "paragraph" as const;
  children: WrappedSignal<Node[]>;
  constructor(children: Node[]) {
    this.children = createSignal(children);
  }
}

export const ParagraphRenderer: NodeRenderer<ParagraphNode> = (props) => {
  const { renderer_manager, node, editor } = props;

  let container!: WithMixEditorNode<HTMLParagraphElement>;
  onMount(() => {
    container.mixed_node = node;
  });

  return (
    <p class="_paragraph" ref={container}>
      {node.children.get().map((child) =>
        renderer_manager.get(child.type)({
          renderer_manager,
          node: child,
          editor,
        })
      )}
    </p>
  );
};

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
          tdo.children.map((child) => editor.saver.load_node_from_tdo(child))
        );
        const paragraph_node = new ParagraphNode(children);
        children.forEach((child) => {
          editor.node_manager.set_parent(child, paragraph_node);
        });
        return paragraph_node;
      });

      editor.node_manager.register_handler(
        "paragraph",
        "save",
        async (_, node) => {
          const paragraph_node = node as ParagraphNode;
          return {
            type: "paragraph",
            children: await Promise.all(
              paragraph_node.children
                .get()
                .map((child) =>
                  editor.node_manager.execute_handler("save", child)
                )
            ),
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
