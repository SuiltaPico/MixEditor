import { Component, onMount } from "solid-js";
import { ContentRenderer } from "./ContentRenderer";
import { MixEditor } from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";
import { SelectionRenderer } from "./SelectionRenderer";
import { BvSelection } from "../BvSelection";

/** 编辑器渲染器。
 * 入口组件，负责渲染整个编辑器。
 */
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
          type: "bv:pointer_down",
          raw: e as PointerEvent,
        });
      }}
      onPointerMove={(e) => {
        editor.event_manager.emit({
          type: "bv:pointer_move",
          raw: e,
        });
      }}
      onKeyDown={(e) => {
        editor.event_manager.emit({
          type: "bv:key_down",
          raw: e,
        });
      }}
      ref={container}
    >
      <ContentRenderer editor={editor} renderer_manager={renderer_manager} />
      <SelectionRenderer
        editor={editor}
        renderer_manager={renderer_manager}
        bv_selection={bv_selection}
      />
    </div>
  );
};
