import {
  BvRenderableCompo,
  BvRenderSelectionDecision,
  from_solidjs_compo,
  get_caret_pos_from_point,
  NodeRenderer,
} from "@mixeditor/browser-view";
import {
  MixEditor,
  TextChildCompo,
  TreeCollapsedSelectionType,
} from "@mixeditor/core";
import { TextEntInitPipeId } from "@mixeditor/document";

export const TextEntRenderer: NodeRenderer = (props) => {
  const ent_id = props.ent_id;
  const bv_ctx = props.bv_ctx;
  const editor = bv_ctx.editor;
  const { ecs } = editor;

  const text_compo = ecs.get_compo(ent_id, TextChildCompo.type);
  function handle_pointer_down(event: PointerEvent) {
    // @ts-ignore
    event.me_handled = true;
    const result = get_caret_pos_from_point(event.clientX, event.clientY)!;
    if (!result) return;
    // 需要溢出光标处理
    editor.selection.set_selection({
      type: TreeCollapsedSelectionType,
      caret: {
        ent_id: ent_id,
        offset: result.offset,
      },
    });
  }

  return (
    <span class="_text" onPointerDown={handle_pointer_down}>
      {text_compo.content.get()}
    </span>
  );
};

export function register_TextEnt_extend(editor: MixEditor) {
  const { pipe } = editor;
  const init_pipe = pipe.get_pipe(TextEntInitPipeId)!;

  init_pipe.set_stage({
    id: "doc_bv_bridge",
    execute: async (event) => {
      const { it } = event;
      const { ecs, content } = editor;

      const bv_renderable_compo = new BvRenderableCompo({
        renderer: from_solidjs_compo(TextEntRenderer),
        custom_get_child_pos: (params) => {
          console.log("custom_get_child_pos", params);

          const render_result = bv_renderable_compo.render_result;
          if (!render_result) return undefined;

          const root_render_result = ecs.get_compo(
            content.root.get()!,
            BvRenderableCompo.type
          )?.render_result;
          if (!root_render_result) return undefined;

          const root_node = root_render_result.node as HTMLElement;
          const root_rect = root_node.getBoundingClientRect();

          const node = (render_result.node as HTMLElement).firstChild as Text;
          const range = document.createRange();
          range.selectNode(node);
          let index = params.index;
          if (params.index < node.length) {
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rect = range.getBoundingClientRect();

            return {
              x: rect.left - root_rect.left,
              y: rect.top - root_rect.top,
              height: rect.height,
            };
          } else {
            index = node.length - 1;
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rect = range.getBoundingClientRect();

            return {
              x: rect.right - root_rect.left,
              y: rect.top - root_rect.top,
              height: rect.height,
            };
          }
        },
        // render_selection_policy: BvRenderSelectionDecision.,
      });
      ecs.set_compos(it.id, [bv_renderable_compo]);
    },
  });
}
