import { Component, createMemo, Show } from "solid-js";
import { MixEditor } from "@mixeditor/core";
import { BvSelection } from "../BvSelection";
import "./SelectionRenderer.css";

/** 选区渲染器。
 * 负责渲染选区。
 */
export const SelectionRenderer: Component<{
  editor: MixEditor;
  bv_selection: BvSelection;
}> = (props) => {
  // TODO: 之后添加多选区范围渲染
  return (
    <div class="_mixeditor_selection">
      <RangeRenderer editor={props.editor} bv_selection={props.bv_selection} />
    </div>
  );
};

/** 选区范围渲染器 */
export const RangeRenderer: Component<{
  editor: MixEditor;
  bv_selection: BvSelection;
}> = (props) => {
  const { editor, bv_selection } = props;
  const selection = editor.selection;
  const selected_type = createMemo(() => selection.selected.get()?.type);
  let start_caret: HTMLDivElement | null = null;
  let end_caret: HTMLDivElement | null = null;
  /** 选区输入框。用于激活浏览器输入法。 */
  let inputer: HTMLDivElement | null = null;

  const handle_inputer_composition_end = () => {
    // TODO: 处理输入法结束
  };

  const handle_inputer_input = () => {
    // TODO: 处理输入
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
