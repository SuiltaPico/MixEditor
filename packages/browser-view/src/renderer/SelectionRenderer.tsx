import {
  Component,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import {
  ExtendedSelected,
  get_common_ancestor_from_node,
  MixEditor,
  Node,
} from "@mixeditor/core";
import { NodeRendererManager } from "./NodeRendererManager";
import { BvSelection } from "../BvSelection";
import "./SelectionRenderer.css";
import { createSignal, Rect } from "@mixeditor/common";
import { SelectedMaskDecisionRender } from "../resp_chain/Selection";

/** 选区渲染器。
 * 负责渲染选区。
 */
export const SelectionRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  bv_selection: BvSelection;
}> = (props) => {
  // TODO: 添加多选区范围渲染
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

async function execute_selected_mask_respo_chain(
  editor: MixEditor,
  node: Node,
  from: number,
  to: number,
  rects: Rect[]
) {
  const result = await editor.node_manager.execute_handler(
    "bv:handle_selected_mask",
    node,
    from,
    to
  );
  const type = result?.type ?? "skip";
  if (type === "skip") return;
  else if (type === "enter") {
    const length = await editor.node_manager.execute_handler(
      "get_children_count",
      node
    )!;
    if (to > length) {
      to = length - 1;
    }
    let promises: Promise<void>[] = [];
    for (let i = from; i <= to; i++) {
      // 全选子节点
      promises.push(
        execute_selected_mask_respo_chain(
          editor,
          (await editor.node_manager.execute_handler(
            "get_child",
            node,
            i
          )) as Node,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    await Promise.all(promises);
  } else if (type === "render") {
    rects.push(...(result as SelectedMaskDecisionRender).rects);
  }
}

async function get_rect_of_extended_selected(
  editor: MixEditor,
  selected: ExtendedSelected
) {
  const node_manager = editor.node_manager;
  let rects: Rect[] = [];

  const start_node = selected.start.node;
  const start_child_path = selected.start.child_path;
  const end_node = selected.end.node;
  const end_child_path = selected.end.child_path;

  if (start_node === end_node) {
    // 如果起始和结束节点是同一个节点，则直接在该节点上进行选择
    await execute_selected_mask_respo_chain(
      editor,
      start_node,
      start_child_path,
      end_child_path,
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
  const result = await get_common_ancestor_from_node(
    node_manager,
    start_node,
    end_node
  );
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
    execute_selected_mask_respo_chain(
      editor,
      start_node,
      start_child_path,
      Number.MAX_SAFE_INTEGER,
      rects
    ),
    execute_selected_mask_respo_chain(
      editor,
      end_node,
      0,
      end_child_path,
      rects
    ),
  ];

  let current: Node | undefined;
  const reversed_start_ancestors = start_ancestors
    .slice(ancestor_index + 1)
    .toReversed();
  const reversed_end_ancestors = end_ancestors
    .slice(ancestor_index + 1)
    .toReversed();

  // 从起始节点向上遍历，直到共同祖先
  current = start_node;
  for (let i = 0; i < reversed_start_ancestors.length; i++) {
    const current_parent = reversed_start_ancestors[i];
    const parent_length = await node_manager.execute_handler(
      "get_children_count",
      current_parent
    )!;

    // 获取当前节点在父节点中的索引
    const current_index = await node_manager.execute_handler(
      "get_index_of_child",
      current_parent,
      current as any
    )!;

    // 处理后侧兄弟节点的选区
    for (let i = current_index + 1; i < parent_length; i++) {
      promises.push(
        execute_selected_mask_respo_chain(
          editor,
          (await node_manager.execute_handler(
            "get_child",
            current_parent,
            i
          )) as Node,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    current = current_parent;
  }

  // 从结束节点向上遍历，直到共同祖先
  current = end_node;
  for (let i = 0; i < reversed_end_ancestors.length; i++) {
    const current_parent = reversed_end_ancestors[i];
    // 获取当前节点在父节点中的索引
    const current_index = await node_manager.execute_handler(
      "get_index_of_child",
      current_parent,
      current as any
    )!;

    // 处理前侧兄弟节点的选区
    for (let i = current_index - 1; i >= 0; i--) {
      promises.push(
        execute_selected_mask_respo_chain(
          editor,
          (await node_manager.execute_handler(
            "get_child",
            current_parent,
            i
          )) as Node,
          0,
          Number.MAX_SAFE_INTEGER,
          rects
        )
      );
    }
    current = current_parent;
  }

  // 起始节点在共同祖先的子节点索引
  const start_ancestor_index = await node_manager.execute_handler(
    "get_index_of_child",
    common_ancestor,
    start_ancestors[ancestor_index + 1] as any
  )!;

  // 结束节点在共同祖先的子节点索引
  const end_ancestor_index = await node_manager.execute_handler(
    "get_index_of_child",
    common_ancestor,
    end_ancestors[ancestor_index + 1] as any
  )!;

  for (let i = start_ancestor_index + 1; i < end_ancestor_index; i++) {
    promises.push(
      execute_selected_mask_respo_chain(
        editor,
        (await node_manager.execute_handler(
          "get_child",
          common_ancestor,
          i
        )) as Node,
        0,
        Number.MAX_SAFE_INTEGER,
        rects
      )
    );
  }

  await Promise.all(promises);

  return rects;
}
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

  let caret: HTMLDivElement | null = null;
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
      if (selected) {
        const info =
          selected.type === "collapsed"
            ? selected.start
            : selected[selected.anchor];
        const result = await editor.node_manager.execute_handler(
          "bv:get_child_caret",
          info.node,
          info.child_path
        );
        if (!result) return;
        caret!.style.left = `${result.x}px`;
        caret!.style.top = `${result.y}px`;
        caret!.style.height = `${result.height}px`;
      }

      if (selected && selected.type === "extended") {
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
        when={selected_type() === "collapsed" || selected_type() === "extended"}
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
