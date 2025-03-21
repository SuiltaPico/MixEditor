import {
  Component,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { create_Signal, Rect } from "@mixeditor/common";
import { BvContext } from "../../context";
import {
  Ent,
  get_child_ent_count,
  get_child_ent_id,
  get_index_of_child_ent,
  MixEditor,
  process_shallow_nodes,
  TreeCollapsedSelectionType,
  TreeExtendedSelection,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import { execute_render_selection } from "../../pipe";
import "./selection.css";
import { BvRenderableCompo } from "../../compo";

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

  // 如果起始和结束节点不是同一个节点，则要选择它们之间的所有节点
  // 选择流程分三个阶段：
  // 1. 从起始节点向上遍历到共同祖先的子节点，期间处理后侧兄弟节点的选区
  // 2. 从结束节点向上遍历到共同祖先的子节点，期间处理前侧兄弟节点的选区
  // 3. 从起始节点在共同祖先的子节点下一位开始，到结束节点在共同祖先的子节点上一位结束，期间选择所有子节点的选区

  const promises: Promise<void>[] = [];
  process_shallow_nodes(
    ecs,
    start_ent,
    start_offset,
    end_ent,
    end_offset,
    (ent, start_offset, end_offset) => {
      console.log(
        "[process_shallow_nodes]",
        ecs.get_ent(ent),
        start_offset,
        end_offset
      );

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

  const selection = editor.selection;
  /** 选区范围。 */
  const ranges = create_Signal<
    {
      start: {
        x: number;
        y: number;
      };
      end: { x: number; y: number };
    }[]
  >([]);
  const selected_type = createMemo(() => selection.get_selection()?.type);

  let caret: HTMLDivElement | null = null;
  /** 选区输入框。用于激活浏览器输入法。 */
  let inputer: HTMLDivElement | null = null;
  let resize_observer: ResizeObserver | undefined;

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
    if (!bv_ctx.editor_node) return;
    bv_ctx.editor_node.addEventListener("pointerup", focus_inputer);
    resize_observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
      }
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
      async (selected) => {
        if (selected?.type === TreeCollapsedSelectionType) {
          console.log("selection changed", selected.type, selected.caret);
        } else if (selected?.type === TreeExtendedSelectionType) {
          console.log(
            "selection changed",
            selected.type,
            "start:",
            editor.ecs.get_ent(selected.start.ent_id),
            selected.start.offset,
            "end:",
            editor.ecs.get_ent(selected.end.ent_id),
            selected.end.offset,
            "anchor:",
            selected.anchor
          );
        } else {
          console.log("selection changed", selected);
        }

        const root_rect = (
          bv_ctx.editor.ecs.get_compo(
            bv_ctx.editor.content.root.get()!,
            BvRenderableCompo.type
          )?.render_result?.node as HTMLElement
        )?.getBoundingClientRect();
        if (!root_rect) return;

        if (selected) {
          const info =
            selected.type === TreeCollapsedSelectionType
              ? selected.caret
              : selected.start;
          const renderable = editor.ecs.get_compo(
            info.ent_id,
            BvRenderableCompo.type
          );
          if (!renderable) return;
          const result = renderable.get_child_pos({
            editor,
            ent_id: info.ent_id,
            index: info.offset,
            root_rect,
          });
          if (!result) return;
          caret!.style.left = `${result.x}px`;
          caret!.style.top = `${result.y}px`;
          caret!.style.height = `${result.height}px`;
          caret!.classList.remove("__blink");
          requestAnimationFrame(() => {
            caret!.classList.add("__blink");
          });
        }

        if (selected && selected.type === TreeExtendedSelectionType) {
          const rects = await get_rect_of_extended_selected(
            editor,
            selected,
            root_rect
          );
          // 更新选区范围
          ranges.set(
            rects.map((rect) => ({
              start: { x: rect.x, y: rect.y },
              end: { x: rect.x + rect.width, y: rect.y + rect.height },
            }))
          );
        } else {
          ranges.set([]);
        }
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
        <div class="_caret" ref={(it) => (caret = it)}>
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
                left: `${range.start.x}px`,
                top: `${range.start.y}px`,
                width: `${range.end.x - range.start.x}px`,
                height: `${range.end.y - range.start.y}px`,
              } as any
            }
          ></div>
        ))}
      </div>
    </>
  );
};
