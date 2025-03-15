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
  get_common_ancestor_from_ent,
  get_index_of_child_ent,
  MixEditor,
  TreeExtendedSelection,
} from "@mixeditor/core";
import { execute_render_selection } from "../../pipe";
import { get_bv_child_position } from "../../compo";
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
    <div class="_mixeditor_selection">
      <TreeRangeRenderer bv_ctx={props.bv_ctx} />
    </div>
  );
};

async function get_rect_of_extended_selected(
  editor: MixEditor,
  selection: TreeExtendedSelection
) {
  const { ecs } = editor;
  let rects: Rect[] = [];

  const start_ent = selection.start.ent_id;
  const start_offset = selection.start.offset;
  const end_ent = selection.end.ent_id;
  const end_offset = selection.end.offset;

  if (start_ent === end_ent) {
    // 如果起始和结束节点是同一个节点，则直接在该节点上进行选择
    await execute_render_selection(
      editor,
      start_ent,
      start_offset,
      end_offset,
      rects
    );
    return rects;
  }

  // 如果起始和结束节点不是同一个节点，则要选择它们之间的所有节点
  // 选择流程分三个阶段：
  // 1. 从起始节点向上遍历到共同祖先的子节点，期间处理后侧兄弟节点的选区
  // 2. 从结束节点向上遍历到共同祖先的子节点，期间处理前侧兄弟节点的选区
  // 3. 从起始节点在共同祖先的子节点下一位开始，到结束节点在共同祖先的子节点上一位结束，期间选择所有子节点的选区

  // 获取起始和结束节点的共同祖先
  const result = await get_common_ancestor_from_ent(ecs, start_ent, end_ent);
  // 如果找不到共同祖先。则代表并不在同一棵树上，则因为无法选中而流程结束，返回空数组
  if (!result) return rects;

  const {
    common_ancestor,
    ancestors1: start_ancestors,
    ancestors2: end_ancestors,
    ancestor_index,
  } = result;

  const promises: Promise<void>[] = [
    // 先选中起始节点和结束节点
    execute_render_selection(
      editor,
      start_ent,
      start_offset,
      Number.MAX_SAFE_INTEGER,
      rects
    ),
    execute_render_selection(editor, end_ent, 0, end_offset, rects),
  ];

  let current: string | undefined;
  const reversed_start_ancestors = start_ancestors
    .slice(ancestor_index + 1)
    .toReversed();
  const reversed_end_ancestors = end_ancestors
    .slice(ancestor_index + 1)
    .toReversed();

  // 从起始节点向上遍历，直到共同祖先
  current = start_ent;
  for (let i = 0; i < reversed_start_ancestors.length; i++) {
    const current_parent = reversed_start_ancestors[i];
    const parent_length = get_child_ent_count(ecs, current_parent);

    // 获取当前节点在父节点中的索引
    const current_index = get_index_of_child_ent(ecs, current_parent, current);

    // 处理后侧兄弟节点的选区
    for (let i = current_index + 1; i < parent_length; i++) {
      const child_ent_id = get_child_ent_id(ecs, current_parent, i);
      if (!child_ent_id) continue;

      promises.push(
        execute_render_selection(
          editor,
          child_ent_id,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    current = current_parent;
  }

  // 从结束节点向上遍历，直到共同祖先
  current = end_ent;
  for (let i = 0; i < reversed_end_ancestors.length; i++) {
    const current_parent = reversed_end_ancestors[i];
    // 获取当前节点在父节点中的索引
    const current_index = get_index_of_child_ent(ecs, current_parent, current);

    // 处理前侧兄弟节点的选区
    for (let i = current_index - 1; i >= 0; i--) {
      const child_ent_id = get_child_ent_id(ecs, current_parent, i);
      if (!child_ent_id) continue;

      promises.push(
        execute_render_selection(
          editor,
          child_ent_id,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    current = current_parent;
  }

  // 起始节点在共同祖先的子节点索引
  const start_ancestor_index = get_index_of_child_ent(
    ecs,
    common_ancestor,
    start_ancestors[ancestor_index + 1]
  );

  // 结束节点在共同祖先的子节点索引
  const end_ancestor_index = get_index_of_child_ent(
    ecs,
    common_ancestor,
    end_ancestors[ancestor_index + 1]
  );

  for (let i = start_ancestor_index + 1; i < end_ancestor_index; i++) {
    const child_ent_id = get_child_ent_id(ecs, common_ancestor, i);
    if (!child_ent_id) continue;

    promises.push(
      execute_render_selection(
        editor,
        child_ent_id,
        0,
        Number.MAX_SAFE_INTEGER,
        rects
      )
    );
  }

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
    bv_ctx.editor_node.addEventListener("pointerup", focus_inputer);
    resize_observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
      }
    });
    resize_observer.observe(bv_ctx.editor_node);
  });

  onCleanup(() => {
    bv_ctx.editor_node.removeEventListener("pointerup", focus_inputer);
    resize_observer?.disconnect();
  });

  // 自动更新选区位置
  createEffect(
    on(selection.get_selection, async (selected) => {
      if (selected) {
        const info =
          selected.type === "tree:collapsed" ? selected.caret : selected.start;
        const result = get_bv_child_position(editor, info.ent_id, info.offset);
        if (!result) return;
        caret!.style.left = `${result.x}px`;
        caret!.style.top = `${result.y}px`;
        caret!.style.height = `${result.height}px`;
      }

      if (selected && selected.type === "tree:extended") {
        const rects = await get_rect_of_extended_selected(editor, selected);
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
    })
  );

  return (
    <>
      <Show
        when={
          selected_type() === "tree:collapsed" ||
          selected_type() === "tree:extended"
        }
      >
        <div class="__caret" ref={(it) => (caret = it)}>
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
