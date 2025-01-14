import { MixEditorPluginContext } from "@mixeditor/core";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
import { render } from "solid-js/web";
import { EditorRenderer } from "./renderer/EditorRenderer";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { BvSelection } from "./BvSelection";

export interface BrowserViewPluginResult {
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}

export function browser_view(props: { element: HTMLElement }) {
  let renderer_disposer: () => void;
  return {
    id: "browser-view",
    init: (ctx: MixEditorPluginContext) => {
      const renderer_manager = new NodeRendererManager();
      renderer_manager.register("document", DocumentRenderer);

      const bv_selection = new BvSelection(ctx.editor);

      renderer_disposer = render(
        () => (
          <EditorRenderer
            editor={ctx.editor}
            renderer_manager={renderer_manager}
            bv_selection={bv_selection}
          />
        ),
        props.element
      );
      return {
        renderer_manager,
        bv_selection,
      };
    },
    dispose: () => {
      renderer_disposer();
    },
  };
}
