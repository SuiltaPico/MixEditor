import { Component, createSignal } from "solid-js";
import { DocumentRenderer } from "./DocumentRenderer";
import { MixEditor } from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";

export const Renderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
}> = (props) => {
  return (
    <div class="mix_editor">
      <DocumentRenderer editor={props.editor} renderer_manager={props.renderer_manager} />
    </div>
  );
};
