import { create_Signal, Rect } from "@mixeditor/common";
import {
  create_InputDataEvent,
  create_InputEntsEvent,
  MEDataTransfer,
  MESelection,
  MixEditor,
  process_shallow_nodes,
  TempEntType,
  TextChildCompo,
  TreeCollapsedSelectionType,
  TreeExtendedSelection,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import {
  Component,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { BvRenderableCompo } from "../../compo";
import { BvContext } from "../../context";
import { execute_render_selection } from "../../pipe";
import "./selection.css";

/** 选区渲染器。
 *
 * 负责渲染选区。
 */
export const SelectionRenderer: Component<{
  bv_ctx: BvContext;
}> = (props) => {
  // TODO: 添加多选区范围渲染
  return (
    <div class="_bv_selection">
      <TreeRangeRenderer bv_ctx={props.bv_ctx} />
    </div>
  );
};

async function get_rect_of_extended_selected(
  editor: MixEditor,
  selection: TreeExtendedSelection,
  root_rect: Rect
) {
  const { ecs } = editor;
  let rects: Rect[] = [];

  const start_ent = selection.start.ent_id;
  const start_offset = selection.start.offset;
  const end_ent = selection.end.ent_id;
  const end_offset = selection.end.offset;

  if (start_ent === end_ent) {
    console.log(
      "[get_rect_of_extended_selected] same ent",
      start_ent,
      start_offset,
      end_offset
    );
    // 如果起始和结束节点是同一个节点，则直接在该节点上进行选择
    await execute_render_selection(
      editor,
      start_ent,
      start_offset,
      end_offset,
      root_rect,
      rects
    );
    return rects;
  }

  const promises: Promise<void>[] = [];
  process_shallow_nodes(
    ecs,
    start_ent,
    start_offset,
    end_ent,
    end_offset,
    (ent, start_offset, end_offset) => {
      promises.push(
        execute_render_selection(
          editor,
          ent,
          start_offset,
          end_offset,
          root_rect,
          rects
        )
      );
    }
  );

  await Promise.all(promises);

  return rects;
}

/** 文档选区范围渲染器。 */
export const TreeRangeRenderer: Component<{
  bv_ctx: BvContext;
}> = (props) => {
  const { bv_ctx } = props;
  const { editor } = bv_ctx;
  const { pipe } = editor;

  const selection = editor.selection;
  /** 选区范围。 */
  const ranges = create_Signal<Rect[]>([]);
  const selected_type = createMemo(() => selection.get_selection()?.type);

  let caret_node!: HTMLDivElement;
  /** 选区输入框。用于激活浏览器输入法。 */
  let inputer: HTMLDivElement | null = null;
  let resize_observer: ResizeObserver | undefined;

  const handle_inputer_composition_end = async (e: CompositionEvent) => {
    // TODO: 处理输入法结束
    let s = selection.get_selection();
    if (!s) return;

    if (e.data !== null) {
      await pipe.execute(
        create_InputDataEvent(
          editor,
          {
            types: ["text/plain"],
            get_data() {
              return e.data;
            },
          } as MEDataTransfer,
          s
        )
      );
    }

    e.preventDefault();
  };

  const handle_inputer_input = async (e: InputEvent) => {
    // TODO: 处理输入
    console.log("handle_inputer_input", e);

    let s = selection.get_selection();
    if (e.isComposing || !s) return;

    let data_transfer: MEDataTransfer;
    if (e.data !== null) {
      const temp_ent = await editor.ecs.create_ent(TempEntType);
      editor.ecs.set_compo(temp_ent.id, new TextChildCompo(e.data));

      data_transfer = {
        types: ["text/plain"],
        get_data() {
          return e.data;
        },
      } as MEDataTransfer;
    } else {
      data_transfer = {
        types: e.dataTransfer!.types,
        get_data(type: string) {
          return e.dataTransfer!.getData(type);
        },
      } as MEDataTransfer;
    }

    await pipe.execute(create_InputDataEvent(editor, data_transfer, s));

    e.preventDefault();
    inputer!.textContent = "";
  };

  function focus_inputer() {
    inputer?.focus();
  }

  async function update_selection(selection?: MESelection) {
    if (!selection) {
      return;
    } else if (selection.type !== TreeExtendedSelectionType) {
      ranges.set([]);
    }

    const root_rect = (
      bv_ctx.editor.ecs.get_compo(
        bv_ctx.editor.content.root.get()!,
        BvRenderableCompo.type
      )?.render_result?.node as HTMLElement
    )?.getBoundingClientRect();
    if (!root_rect) return;

    const caret =
      selection.type === TreeCollapsedSelectionType
        ? selection.caret
        : selection.start;
    const renderable = editor.ecs.get_compo(
      caret.ent_id,
      BvRenderableCompo.type
    );
    if (!renderable) return;
    const result = renderable.get_child_pos({
      editor,
      ent_id: caret.ent_id,
      index: caret.offset,
      root_rect,
    });
    if (!result) return;
    caret_node.style.left = `${result.x}px`;
    caret_node.style.top = `${result.y}px`;
    caret_node.style.height = `${result.height}px`;

    // 让光标从新执行闪烁动画
    caret_node!.classList.remove("__blink");
    requestAnimationFrame(() => {
      caret_node!.classList.add("__blink");
    });

    if (selection.type === TreeExtendedSelectionType) {
      const rects = await get_rect_of_extended_selected(
        editor,
        selection,
        root_rect
      );
      // 更新选区范围
      ranges.set(rects);
    }
  }

  onMount(() => {
    if (!bv_ctx.editor_node) return;
    bv_ctx.editor_node.addEventListener("pointerup", focus_inputer);
    resize_observer = new ResizeObserver((entries) => {
      update_selection(selection.get_selection());
    });
    resize_observer.observe(bv_ctx.editor_node);
  });

  onCleanup(() => {
    if (!bv_ctx.editor_node) return;
    bv_ctx.editor_node.removeEventListener("pointerup", focus_inputer);
    resize_observer?.disconnect();
  });

  // 自动更新选区位置
  createEffect(
    on(
      () => selection.get_selection(),
      async (selection) => {
        // DEBUG: 打印选区变化
        if (!selection) {
          console.log("selection changed", selection);
        } else if (selection.type === TreeCollapsedSelectionType) {
          console.log(
            "selection changed",
            selection.type,
            editor.ecs.get_ent(selection.caret.ent_id),
            selection.caret.offset
          );
        } else if (selection.type === TreeExtendedSelectionType) {
          console.log(
            "selection changed",
            selection.type,
            "start:",
            editor.ecs.get_ent(selection.start.ent_id),
            selection.start.offset,
            "end:",
            editor.ecs.get_ent(selection.end.ent_id),
            selection.end.offset,
            "anchor:",
            selection.anchor
          );
        }

        update_selection(selection);
      }
    )
  );

  return (
    <>
      <Show
        when={
          selected_type() === "tree:collapsed" ||
          selected_type() === "tree:extended"
        }
      >
        <div class="_caret" ref={(it) => (caret_node = it)}>
          <div
            class="_inputer"
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
      <div class="_ranges">
        {/* TODO：使用 solid-js 的 For 进行缓存。 */}
        {ranges.get().map((range) => (
          <div
            class="_range"
            style={
              {
                left: `${range.x}px`,
                top: `${range.y}px`,
                width: `${range.width}px`,
                height: `${range.height}px`,
              } as any
            }
          ></div>
        ))}
      </div>
    </>
  );
};
