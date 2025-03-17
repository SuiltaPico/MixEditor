import { MEPlugin, MixEditor } from "@mixeditor/core";
import { register_ents } from "./ent";
import { register_compos } from "./compo";
import { BrowserViewExposed } from "@mixeditor/browser-view";
import { CaretDirection } from "@mixeditor/document";

function handle_key_down(editor: MixEditor, event: KeyboardEvent) {
  if (event.key === "ArrowLeft") {
    editor.pipe.execute({
      pipe_id: "doc:caret_navigate",
      direction: CaretDirection.Prev,
    });
  } else if (event.key === "ArrowRight") {
    editor.pipe.execute({
      pipe_id: "doc:caret_navigate",
      direction: CaretDirection.Next,
    });
  }
}

export function DocBvBridgePlugin(): MEPlugin {
  let bv_ctx: BrowserViewExposed["bv_ctx"] | undefined;
  let key_down_listener: (event: KeyboardEvent) => void;

  return {
    id: "doc_bv_bridge",
    version: "0.0.1",
    meta: {
      name: "Doc Bv Bridge",
      description: "提供文档与浏览器视图的桥接功能。",
      author: "Mixeditor",
    },
    async init(editor) {
      ({ bv_ctx } = (await editor.plugin.wait_plugin_inited(
        "browser_view"
      )) as BrowserViewExposed);

      key_down_listener = (event) => {
        handle_key_down(editor, event);
      };
      bv_ctx!.editor_node.addEventListener("keydown", key_down_listener);

      register_ents(editor);
      register_compos(editor);
    },
    dispose(editor) {
      bv_ctx!.editor_node.removeEventListener("keydown", key_down_listener);
    },
  } satisfies MEPlugin;
}

export type DocBvBridgeExposed = ReturnType<
  ReturnType<typeof DocBvBridgePlugin>["init"]
>;
