import {
  Component,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { MixEditor } from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";
import { BvSelection } from "../BvSelection";
import "./SelectionRenderer.css";
import { createSignal } from "@mixeditor/common";

/** 选区渲染器。
 * 负责渲染选区。
 */
export const SelectionRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}> = (props) => {
  // TODO: 之后添加多选区范围渲染
  return (
    <div class="_mixeditor_selection">
      <RangeRenderer
        editor={props.editor}
        renderer_manager={props.renderer_manager}
        bv_selection={props.bv_selection}
      />
    </div>
  );
};

/** 选区范围渲染器 */
export const RangeRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}> = (props) => {
  const { editor, renderer_manager, bv_selection } = props;

  const selection = editor.selection;
  /** 选区范围。 */
  const ranges = createSignal<
    {
      start: {
        x: number;
        y: number;
      };
      end: { x: number; y: number };
    }[]
  >([]);
  const selected_type = createMemo(() => selection.selected.get()?.type);

  let start_caret: HTMLDivElement | null = null;
  /** 选区输入框。用于激活浏览器输入法。 */
  let inputer: HTMLDivElement | null = null;

  const handle_inputer_composition_end = () => {
    // TODO: 处理输入法结束
  };

  const handle_inputer_input = () => {
    // TODO: 处理输入
  };

  function focus_inputer() {
    inputer?.focus();
  }

  onMount(() => {
    renderer_manager.editor_root.addEventListener("pointerup", focus_inputer);
  });

  onCleanup(() => {
    renderer_manager.editor_root.removeEventListener(
      "pointerup",
      focus_inputer
    );
  });

  // 自动更新选区位置
  createEffect(
    on(selection.selected.get, async (selected) => {
      if (!selected) return;

      const result = await editor.node_manager.execute_handler(
        "bv:get_child_pos",
        selected.start.node,
        selected.start.child_path
      );
      if (!result) return;
      start_caret!.style.left = `${result.x}px`;
      start_caret!.style.top = `${result.y}px`;
    })
  );

  return (
    <>
      <Show
        when={selected_type() === "collapsed" || selected_type() === "extended"}
      >
        <div
          class="__caret"
          ref={(it) => (start_caret = it)}
          style={{
            height: `${bv_selection.start_caret.height.get()}px`,
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
      <div class="__ranges">
        {/* TODO：使用 solid-js 的 For 进行缓存。 */}
        {ranges.get().map((range) => (
          <div
            class="__range"
            style={{
              left: `${range.start.x}px`,
              top: `${range.start.y}px`,
              width: `${range.end.x - range.start.x}px`,
              height: `${range.end.y - range.start.y}px`,
            }}
          ></div>
        ))}
      </div>
    </>
  );
};
