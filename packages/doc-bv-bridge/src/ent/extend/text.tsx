import {
  BvRenderableCompo,
  BvRenderSelectionDecision,
  DOMCaretPos,
  from_solidjs_compo,
  get_caret_pos_from_point,
  NodeRenderer,
} from "@mixeditor/browser-view";
import { throttle } from "@mixeditor/common";
import {
  create_TreeCollapsedSelection,
  create_TreeExtendedSelection,
  get_child_ent_count,
  get_ent_path,
  MixEditor,
  path_compare,
  TextChildCompo,
  TreeCaret,
  TreeCollapsedSelection,
  TreeCollapsedSelectionType,
  TreeExtendedSelection,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import {
  CaretDirection,
  DocCaretNavigateCb,
  execute_navigate_caret_from_pos,
  TextEntInitPipeId,
} from "@mixeditor/document";

async function handle_pointer_down_base(
  editor: MixEditor,
  ent_id: string,
  event: PointerEvent,
  caret_pos: DOMCaretPos
) {
  const caret = await execute_navigate_caret_from_pos(
    editor,
    {
      ent_id: ent_id,
      offset: caret_pos.offset,
    },
    CaretDirection.None
  );
  if (!caret) return;
  editor.selection.set_selection(create_TreeCollapsedSelection(caret));
}

function handle_collapsed_selection(
  editor: MixEditor,
  ent_id: string,
  self_path: number[],
  curr_selection: TreeCollapsedSelection,
  new_caret: TreeCaret
) {
  const start_path = get_ent_path(editor.ecs, curr_selection.caret.ent_id);
  let compare_result;

  if (curr_selection.caret.ent_id === ent_id) {
    compare_result = new_caret.offset - curr_selection.caret.offset;
  } else {
    compare_result = path_compare(self_path, start_path);
  }

  if (compare_result < 0) {
    editor.selection.set_selection(
      create_TreeExtendedSelection(new_caret, curr_selection.caret, "end")
    );
  } else if (compare_result > 0) {
    editor.selection.set_selection(
      create_TreeExtendedSelection(curr_selection.caret, new_caret, "start")
    );
  } else {
    editor.selection.set_selection(create_TreeCollapsedSelection(new_caret));
  }
}

function handle_extended_selection(
  editor: MixEditor,
  caret_ent_id: string,
  caret_path: number[],
  curr_selection: TreeExtendedSelection,
  new_caret: TreeCaret
) {
  const anchor = curr_selection.anchor;
  const anchor_info = curr_selection[anchor];
  const anchor_path = get_ent_path(editor.ecs, anchor_info.ent_id);
  let compare_result;

  if (anchor_info.ent_id === caret_ent_id) {
    compare_result = new_caret.offset - anchor_info.offset;
  } else {
    const p1 = [...caret_path, new_caret.offset];
    const p2 = [...anchor_path, anchor_info.offset];

    compare_result = path_compare(p1, p2);
  }

  if (compare_result < 0) {
    editor.selection.set_selection(
      create_TreeExtendedSelection(new_caret, anchor_info, "end")
    );
  } else if (compare_result > 0) {
    editor.selection.set_selection(
      create_TreeExtendedSelection(anchor_info, new_caret, "start")
    );
  } else {
    editor.selection.set_selection(create_TreeCollapsedSelection(new_caret));
  }
}

async function handle_pointer_move_base(
  editor: MixEditor,
  ent_id: string,
  event: PointerEvent,
  caret_pos: DOMCaretPos
) {
  if (event.buttons !== 1) return;

  // 获取选区
  const selection = editor.selection.get_selection();
  if (!selection) return;

  // 利用比较函数，计算鼠标位置相对于选区起始节点或者锚点位置在前还是后，
  // 然后根据比较结果，选择之前选区到新选区的转换模式。

  let new_caret: TreeCaret | undefined = {
    ent_id,
    offset: caret_pos?.offset,
  };

  new_caret = await execute_navigate_caret_from_pos(
    editor,
    new_caret,
    CaretDirection.None
  );
  if (!new_caret) return;

  // 获取自己的路径和选区起始节点的路径
  const caret_path = get_ent_path(editor.ecs, new_caret.ent_id);

  if (selection.type === TreeCollapsedSelectionType) {
    handle_collapsed_selection(
      editor,
      new_caret.ent_id,
      caret_path,
      selection,
      new_caret
    );
  } else if (selection.type === TreeExtendedSelectionType) {
    handle_extended_selection(
      editor,
      new_caret.ent_id,
      caret_path,
      selection,
      new_caret
    );
  }
}

async function handle_pointer_event_base(
  editor: MixEditor,
  ent_id: string,
  event: PointerEvent,
  handler: (caret_pos: DOMCaretPos) => Promise<void>
) {
  const caret_pos = get_caret_pos_from_point(event.clientX, event.clientY);
  if (!caret_pos) return;
  await handler(caret_pos);
}

export const TextEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;

  const text_compo = ecs.get_compo(ent_id, TextChildCompo.type)!;

  async function handle_pointer_down(event: PointerEvent) {
    // @ts-ignore
    if (event.me_handled) return;
    // @ts-ignore
    event.me_handled = true;
    await handle_pointer_event_base(editor, ent_id, event, (caret_pos) =>
      handle_pointer_down_base(editor, ent_id, event, caret_pos)
    );
  }

  const handle_pointer_move = throttle(async (event: PointerEvent) => {
    await handle_pointer_event_base(editor, ent_id, event, (caret_pos) =>
      handle_pointer_move_base(editor, ent_id, event, caret_pos)
    );
  }, 16);

  return (
    <span
      class="__text"
      onPointerDown={handle_pointer_down}
      onPointerMove={handle_pointer_move}
    >
      {text_compo.content.get()}
    </span>
  );
};

function get_child_pos(
  param: Parameters<
    Exclude<BvRenderableCompo["custom_get_child_pos"], undefined>
  >[0]
) {
  const { editor, root_rect } = param;
  const { ecs } = editor;
  const bv_renderable_compo = ecs.get_compo(
    param.ent_id,
    BvRenderableCompo.type
  );
  if (!bv_renderable_compo) return;
  const render_result = bv_renderable_compo.render_result;
  if (!render_result) return;

  const node = (render_result.node as HTMLElement).firstChild as Text;
  const range = document.createRange();
  range.selectNode(node);

  let index = param.index;
  if (param.index < node.length) {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const rect = range.getBoundingClientRect();

    return {
      x: rect.left - root_rect.x,
      y: rect.top - root_rect.y,
      height: rect.height,
    };
  } else {
    index = node.length - 1;
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const rect = range.getBoundingClientRect();

    return {
      x: rect.right - root_rect.x,
      y: rect.top - root_rect.y,
      height: rect.height,
    };
  }
}

function get_render_selection_decision(
  param: Parameters<
    Exclude<BvRenderableCompo["custom_render_selection"], undefined>
  >[0]
) {
  const { editor, from, to, root_rect } = param;
  const { ecs } = editor;
  const bv_renderable_compo = ecs.get_compo(
    param.ent_id,
    BvRenderableCompo.type
  );
  if (!bv_renderable_compo) return BvRenderSelectionDecision.Ignore;
  const render_result = bv_renderable_compo.render_result;
  if (!render_result) return BvRenderSelectionDecision.Ignore;

  const child_ent_count = get_child_ent_count(editor.ecs, param.ent_id);
  const start = Math.max(0, from);
  const end = Math.min(child_ent_count, to);

  const node = render_result.node as HTMLElement;
  const range = document.createRange();
  range.setStart(node.firstChild as Text, start);
  range.setEnd(node.firstChild as Text, end);

  const rects = range.getClientRects();
  return BvRenderSelectionDecision.DrawRect(
    Array.from(rects).map((rect) => ({
      x: rect.left - root_rect.x,
      y: rect.top - root_rect.y,
      width: rect.width,
      height: rect.height,
    }))
  );
}

function handle_pointer_event_forward(
  params: Parameters<
    Exclude<BvRenderableCompo["handle_pointer_event_forward"], undefined>
  >[0]
) {
  const { editor, pos, event } = params;
  const handler_map = {
    pointerdown: handle_pointer_down_base,
    pointermove: handle_pointer_move_base,
  };

  if (event.type in handler_map) {
    handler_map[event.type as keyof typeof handler_map](
      editor,
      params.ent_id,
      event,
      pos
    );
  }
}

export function register_TextEnt_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(TextEntInitPipeId)!;

  init_pipe.set_stage({
    id: "doc_bv_bridge",
    execute: async (event) => {
      const { it } = event;
      const { ecs } = editor;

      const bv_renderable_compo = new BvRenderableCompo({
        renderer: from_solidjs_compo(TextEntRenderer),
        custom_get_child_pos: get_child_pos,
        custom_render_selection: get_render_selection_decision,
        handle_pointer_event_forward: handle_pointer_event_forward,
      });
      ecs.set_compos(it.id, [bv_renderable_compo]);
    },
  });
}
