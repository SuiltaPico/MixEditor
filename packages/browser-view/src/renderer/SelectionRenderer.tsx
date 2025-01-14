import { Component, createMemo, Show } from "solid-js";
import { MixEditor } from "@mixeditor/core";
import { BvSelection } from "../BvSelection";
import "./SelectionRenderer.css";

export const SelectionRenderer: Component<{
  editor: MixEditor;
  bv_selection: BvSelection;
}> = (props) => {
  return (
    <div class="_mixeditor_selection">
      <CaretRenderer editor={props.editor} bv_selection={props.bv_selection} />
    </div>
  );
};

export const CaretRenderer: Component<{
  editor: MixEditor;
  bv_selection: BvSelection;
}> = (props) => {
  const { editor, bv_selection } = props;
  const selection = editor.selection;
  const selected_type = createMemo(() => selection.selected.get()?.type);
  let start_caret: HTMLDivElement | null = null;
  let end_caret: HTMLDivElement | null = null;
  let inputer: HTMLDivElement | null = null;

  const handle_inputer_composition_end = () => {
    console.log("composition end");
  };

  const handle_inputer_input = () => {
    console.log("input");
  };

  return (
    <div class="__caret">
      <Show
        when={selected_type() === "collapsed" || selected_type() === "extended"}
      >
        <div
          class="__start_caret"
          ref={(it) => (start_caret = it)}
          style={{
            height: `${bv_selection.caret_height.get()}px`,
          }}
        >
          <div
            class="__inputer"
            contentEditable
            ref={(it) => (inputer = it)}
            onCompositionEnd={handle_inputer_composition_end}
            onBeforeInput={handle_inputer_input}
            onPointerDown={(e) => {
              e.preventDefault();
            }}
          />
        </div>
      </Show>
      <Show when={selected_type() === "extended"}>
        <div
          class="__end_caret"
          ref={(it) => (end_caret = it)}
          style={{
            height: `${bv_selection.caret_height.get()}px`,
          }}
        ></div>
      </Show>
    </div>
  );
};
