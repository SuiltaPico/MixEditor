import { Component, onMount } from "solid-js";
import { BvContext } from "../../context";
import { ContentRenderer } from "./content";
// import { SelectionRenderer } from "./selection/selection";

/** 编辑器渲染器。
 * 入口组件，负责渲染整个编辑器。
 */
export const EditorRenderer: Component<BvContext> = (bv_ctx) => {
  const { editor } = bv_ctx;

  let container!: HTMLDivElement;
  onMount(() => {
    bv_ctx.editor_node = container;
  });

  return (
    <div
      class="mix_editor"
      onPointerDown={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:pointer_down",
          raw: e as PointerEvent,
        });
      }}
      onPointerUp={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:pointer_up",
          raw: e as PointerEvent,
        });
      }}
      onPointerMove={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:pointer_move",
          raw: e as PointerEvent,
        });
      }}
      onKeyDown={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:key_down",
          raw: e as KeyboardEvent,
        });
      }}
      onKeyUp={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:key_up",
          raw: e as KeyboardEvent,
        });
      }}
      onKeyPress={(e) => {
        editor.pipe.execute({
          pipe_id: "bv:key_press",
          raw: e as KeyboardEvent,
        });
      }}
      ref={container}
    >
      <ContentRenderer bv_ctx={bv_ctx} />
      {/* <SelectionRenderer bv_ctx={bv_ctx} /> */}
    </div>
  );
};
