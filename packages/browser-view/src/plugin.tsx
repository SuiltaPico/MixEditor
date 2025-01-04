import { MixEditorPluginContext } from "@mixeditor/core";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
import { render } from "solid-js/web";
import { EditorRenderer } from "./renderer/EditorRenderer";
import { DocumentRenderer } from "./renderer/DocumentRenderer";

export interface BrowserViewPluginResult {
  renderer_manager: NodeRendererManager;
}

export function browser_view(props: { element: HTMLElement }) {
  const renderer_manager = new NodeRendererManager();
  let renderer_disposer: () => void;

  renderer_manager.register("document", DocumentRenderer);

  return {
    id: "browser-view",
    init: (ctx: MixEditorPluginContext) => {
      renderer_disposer = render(
        () => (
          <EditorRenderer
            editor={ctx.editor}
            renderer_manager={renderer_manager}
          />
        ),
        props.element
      );
      return {
        renderer_manager,
      };
    },
    dispose: () => {
      renderer_disposer();
    },
  };
}
