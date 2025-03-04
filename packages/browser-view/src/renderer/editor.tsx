import { Component, onMount } from "solid-js";
import { BvContext } from "../context";
import { ContentRenderer } from "./content";
import { SelectionRenderer } from "./SelectionRenderer";

/** 编辑器渲染器。
 * 入口组件，负责渲染整个编辑器。
 */
export const EditorRenderer: Component<BvContext> = (bv_ctx) => {
  const { editor, selection_ctx: bv_selection } = bv_ctx;

  let container!: HTMLDivElement;
  onMount(() => {
    bv_ctx.root_node = container;
  });

  return (
    <div
      class="mix_editor"
      onPointerDown={(e) => {
        editor.pipe.execute({
          type: "bv:pointer_down",
          raw: e as PointerEvent,
          context: {},
        });
      }}
      onPointerUp={(e) => {
        editor.pipe.execute({
          type: "bv:pointer_up",
          raw: e as PointerEvent,
          context: {},
        });
      }}
      onPointerMove={(e) => {
        editor.pipe.execute({
          type: "bv:pointer_move",
          raw: e,
          context: {},
        });
      }}
      onKeyDown={(e) => {
        editor.pipe.execute({
          type: "bv:key_down",
          raw: e,
        });
      }}
      onKeyUp={(e) => {
        editor.pipe.execute({
          type: "bv:key_up",
          raw: e,
        });
      }}
      onKeyPress={(e) => {
        editor.pipe.execute({
          type: "bv:key_press",
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
