import { Component, onMount } from "solid-js";
import { BvContext } from "../../context";
import { ContentRenderer } from "./content";
import { SelectionRenderer } from "../selection";

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
    <div class="mix_editor" ref={container}>
      <ContentRenderer bv_ctx={bv_ctx} />
      <SelectionRenderer bv_ctx={bv_ctx} />
    </div>
  );
};
