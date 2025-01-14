import { Component, onMount } from "solid-js";
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
  const { editor, renderer_manager, bv_selection } = props;

  let container!: HTMLDivElement;
  onMount(() => {
    renderer_manager.editor_root = container;
  });

  return (
    <div
      class="mix_editor"
      onPointerDown={(e) => {
        editor.event_manager.emit({
          event_type: "bv:pointer_down",
          raw: e,
        });
      }}
      onPointerUp={(e) => {
        editor.event_manager.emit({
          event_type: "bv:pointer_up",
          raw: e,
        });
      }}
      onPointerMove={(e) => {
        editor.event_manager.emit({
          event_type: "bv:pointer_move",
          raw: e,
        });
      }}
      ref={container}
    >
      <ContentRenderer editor={editor} renderer_manager={renderer_manager} />
      <SelectionRenderer editor={editor} bv_selection={bv_selection} />
    </div>
  );
};
