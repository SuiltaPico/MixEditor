import { Component, createSignal } from "solid-js";
import { ContentRenderer } from "./ContentRenderer";
import { MixEditor } from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";

export const EditorRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
}> = (props) => {
  return (
    <div class="mix_editor">
      <ContentRenderer
        editor={props.editor}
        renderer_manager={props.renderer_manager}
      />
    </div>
  );
};
