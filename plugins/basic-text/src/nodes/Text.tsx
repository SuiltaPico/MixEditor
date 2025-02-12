import {
  BrowserViewPluginResult,
  NodeRenderer,
  PointerEventResult,
  SelectedMaskResult,
  WithMixEditorNode,
  get_caret_pos_from_point,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  get_node_path,
  MixEditorPluginContext,
  Node,
  path_compare,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    text: TextNode;
  }
}

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
}

export class TextNode implements Node {
  type = "text" as const;
  text: WrappedSignal<string>;
  constructor(text: string) {
    this.text = createSignal(text);
  }
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  const { node, editor } = props;

  let container!: WithMixEditorNode<HTMLElement>;
  onMount(() => {
    container.mixed_node = node;
    const context = editor.node_manager.get_context(node);
    if (context) {
      context["bv:html_node"] = container;
    }
  });

  return (
    <span class="_text" ref={container}>
      {node.text.get()}
    </span>
  );
};

export function text() {
  return {
    id: "text",
    async init(ctx: MixEditorPluginContext) {
      const { editor } = ctx;
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const { renderer_manager, bv_selection } = browser_view_plugin;

      editor.saver.register_loader<TextNodeTDO>("text", (tdo) => {
        return new TextNode(tdo.content);
      });

      editor.node_manager.register_handlers("text", {
        save: (_, node) => {
          return {
            type: "text",
            content: node.text.get(),
          } satisfies TextNodeTDO;
        },
        get_children_count: (_, node) => {
          return node.text.get().length;
        },
        slice: (_, node, start, end) => {
          return new TextNode(node.text.get().slice(start, end));
        },
        "bv:handle_pointer_down": (_, node, element, event) => {
          const result = get_caret_pos_from_point(
            event.clientX,
            event.clientY
          )!;
          if (!result) return PointerEventResult.skip;
          editor.selection.collapsed_select({
            node,
            child_path: result.offset,
          });
          return PointerEventResult.handled;
        },
        "bv:handle_selected_mask": (_, node, from, to) => {
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed") return SelectedMaskResult.skip;

          const context = editor.node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return SelectedMaskResult.skip;

          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();
          const range = document.createRange();
          const textNode = html_node.firstChild;
          if (!textNode) return SelectedMaskResult.skip;

          console.log(from, to);

          range.setStart(textNode, from);
          range.setEnd(textNode, to);

          const range_rect = range.getBoundingClientRect();

          return SelectedMaskResult.render({
            x: range_rect.left - root_rect.left,
            y: range_rect.top - root_rect.top,
            width: range_rect.width,
            height: range_rect.height,
          });
        },
        "bv:handle_pointer_move": async (_, node, element, event) => {
          if (event.buttons !== 1) return PointerEventResult.skip;
          // TODO：下面函数通过节流函数触发，确保最小采样率是 60fps

          // 获取选区
          const selection = editor.selection.get_selected();
          if (!selection) return PointerEventResult.skip;

          // 获取选区起始节点
          const start_node = selection.start.node;

          // 计算鼠标所在的字符索引
          const mouse_index = get_caret_pos_from_point(
            event.clientX,
            event.clientY
          )?.offset;
          if (!mouse_index) return PointerEventResult.skip;

          // 获取自己的路径和选区起始节点的路径
          const self_path = await get_node_path(editor.node_manager, node);
          const start_path = await get_node_path(
            editor.node_manager,
            start_node
          );

          // TODO：移动并不会影响节点树的变化，节点可以缓存自己的路径，甚至是比较结果。
          // TODO：因为节点变更会更新 update_count，只需要比对 update_count 即可判断要不要重新计算一次先后了。

          // 利用比较函数，计算鼠标位置相对于选区起始节点的位置在前还是后
          const compare_result = path_compare(self_path, start_path);
          // 如果在前，则让自己成为选区起始节点
          if (compare_result === -1) {
            editor.selection.extended_select(
              {
                node,
                child_path: mouse_index,
              },
              {
                node: start_node,
                child_path: selection.start.child_path,
              }
            );
          } else {
            // 如果在后，则让自己成为选区结束节点
            editor.selection.extended_select(
              {
                node: start_node,
                child_path: selection.start.child_path,
              },
              {
                node,
                child_path: mouse_index,
              }
            );
          }
          return PointerEventResult.handled;
        },
        "bv:get_child_pos": (_, node, index) => {
          const context = editor.node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return undefined;
          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();

          const range = document.createRange();
          const textNode = html_node.firstChild;
          if (!textNode) throw new Error("文本节点的起始节点丢失。");

          if (index < node.text.get().length) {
            range.setStart(html_node.firstChild!, index);
          } else {
            range.setStart(html_node.firstChild!, index);
          }

          range.collapse(true);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            const caret_rect = range_rects[0];
            bv_selection.start_caret.height.set(caret_rect.height);
            return {
              x: caret_rect.left - root_rect.left - 1,
              y: caret_rect.top - root_rect.top,
            };
          } else {
            // 处理没有rect的情况，比如文本为空
            // 使用html_node的位置作为默认
            const node_rect = html_node.getBoundingClientRect();
            bv_selection.start_caret.height.set(node_rect.height);
            return {
              x: node_rect.left - root_rect.left - 1,
              y: node_rect.top - root_rect.top,
            };
          }
        },
      });

      // 注册渲染器
      renderer_manager.register("text", TextRenderer);
    },
    dispose() {},
  };
}
