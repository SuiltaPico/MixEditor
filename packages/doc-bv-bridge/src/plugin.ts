import {
  create_TreeCollapsedSelection,
  InputEntsPipeID,
  MEPlugin,
  MixEditor,
  Transaction,
  TreeCollapsedSelectionType,
  TreeExtendedSelectionType,
  TreeInsertChildrenOp,
} from "@mixeditor/core";
import { register_ents } from "./ent";
import { register_compos } from "./compo";
import { BrowserViewExposed } from "@mixeditor/browser-view";
import {
  CaretDeleteDirection,
  CaretDirection,
  DocCaretNavigatePipeId,
  DocDirectedDeletePipeId,
  execute_insert,
  execute_range_deletion,
} from "@mixeditor/document";

async function handle_key_down(editor: MixEditor, event: KeyboardEvent) {
  if (event.ctrlKey) {
    if (event.key === "z") {
      console.log("undo");
      await editor.op.executor.undo();
    } else if (event.key === "y") {
      console.log("redo");
      await editor.op.executor.redo();
    }
  }
  if (event.key === "ArrowLeft") {
    editor.pipe.execute({
      pipe_id: DocCaretNavigatePipeId,
      direction: CaretDirection.Prev,
    });
  } else if (event.key === "ArrowRight") {
    editor.pipe.execute({
      pipe_id: DocCaretNavigatePipeId,
      direction: CaretDirection.Next,
    });
  } else if (event.key === "Backspace") {
    const result = await editor.pipe.execute({
      pipe_id: DocDirectedDeletePipeId,
      direction: CaretDeleteDirection.Prev,
    });
    console.log(result);
  } else if (event.key === "Delete") {
    const result = await editor.pipe.execute({
      pipe_id: DocDirectedDeletePipeId,
      direction: CaretDeleteDirection.Next,
    });
    console.log(result);
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
      const [browser_view_plugin, document_plugin] =
        await editor.plugin.wait_plugins_inited(["browser_view", "document"]);

      ({ bv_ctx } = browser_view_plugin as BrowserViewExposed);

      key_down_listener = (event) => {
        handle_key_down(editor, event);
      };
      bv_ctx!.editor_node!.addEventListener("keydown", key_down_listener);

      register_ents(editor);
      register_compos(editor);
    },
    dispose(editor) {
      bv_ctx!.editor_node!.removeEventListener("keydown", key_down_listener);
    },
  } satisfies MEPlugin;
}

export type DocBvBridgeExposed = ReturnType<
  ReturnType<typeof DocBvBridgePlugin>["init"]
>;
