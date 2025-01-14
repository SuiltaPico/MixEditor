import { Component } from "solid-js";
import { ContentRenderer } from "./ContentRenderer";
import { MixEditor } from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";
import { SelectionRenderer } from "./SelectionRenderer";
import { BvSelection } from "../BvSelection";

export const EditorRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}> = (props) => {
  return (
    <div class="mix_editor">
      <ContentRenderer
        editor={props.editor}
        renderer_manager={props.renderer_manager}
      />
      <SelectionRenderer
        editor={props.editor}
        bv_selection={props.bv_selection}
      />
    </div>
  );
};
