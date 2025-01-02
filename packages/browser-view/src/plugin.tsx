import { MixEditorPluginContext } from "@mixeditor/core";
import { NodeRendererManager } from "./renderer/NodeRendererManager";
import { render } from "solid-js/web";
import { Renderer } from "./renderer/Renderer";

export function browser_view(props: { element: HTMLElement }) {
  const renderer_manager = new NodeRendererManager();
  let renderer_disposer: () => void;
  return {
    id: ".browser-view",
    init: (ctx: MixEditorPluginContext) => {
      renderer_disposer = render(
        () => (
          <Renderer editor={ctx.editor} renderer_manager={renderer_manager} />
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
