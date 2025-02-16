import { createSignal, WrappedSignal } from "@mixeditor/common";
import { MixEditor } from "../MixEditor";
import type { Node } from "./Node";
import { AnyTDO } from "../saver/saver";
import { TransferDataObject } from "../saver/TransferDataObject";
import { NavigateDirection } from "../common/navigate";
import {
  CaretNavigateEnterDecision,
  CaretNavigateFrom,
} from "../resp_chain/caret_navigate";
import {
  paragraph_delete_children,
  paragraph_handle_delete_range,
} from "./handlers";

/** 文档。 */
export interface DocumentNode extends Node {
  type: "document";
  children: WrappedSignal<Node[]>;
  schema_version: number;
  created_at: Date;
  modified_at: Date;
}

export function create_DocumentNode(
  id: string,
  params: Partial<Omit<DocumentNode, "type" | "id" | "children">> & {
    children: Node[];
  }
) {
  return {
    id,
    type: "document",
    children: createSignal(params.children ?? [], {
      equals: false,
    }),
    schema_version: params.schema_version ?? 1,
    created_at: params.created_at ?? new Date(),
    modified_at: params.modified_at ?? new Date(),
  } satisfies DocumentNode;
}

export interface DocumentTDO extends TransferDataObject {
  type: "document";
  schema_version: number;
  created_at: Date;
  modified_at: Date;
  children: AnyTDO[];
}

export function create_DocumentTDO(
  id: string,
  params: Partial<Omit<DocumentTDO, "type" | "id">>
): DocumentTDO {
  return {
    id,
    type: "document",
    schema_version: params.schema_version ?? 1,
    created_at: params.created_at ?? new Date(),
    modified_at: params.modified_at ?? new Date(),
    children: params.children ?? [],
  };
}

export async function save_document(editor: MixEditor, document: DocumentNode) {
  return {
    id: document.id,
    type: "document",
    schema_version: document.schema_version,
    created_at: document.created_at,
    modified_at: document.modified_at,
    children: (
      await Promise.all(
        document.children
          .get()
          .map((child) => editor.node_manager.execute_handler("save", child))
      )
    ).filter((child) => child !== undefined),
  } satisfies DocumentTDO;
}

export async function init_document(editor: MixEditor) {
  const { node_manager, saver, event_manager, document } = editor;

  // 注册文档节点保存行为
  node_manager.register_handlers("document", {
    save: save_document,
    get_children_count: (_, node) => {
      return node.children.get().length;
    },
    get_child: (_, node, index) => {
      return node.children.get()[index] as any;
    },
    get_index_of_child: (_, node, child) => {
      return node.children.get().indexOf(child);
    },
    get_children: (_, node) => {
      return node.children.get();
    },
    delete_children: paragraph_delete_children,
    handle_caret_navigate: (_, node, to, direction, from) => {
      const children_count = node.children.get().length;
      const to_prev = direction === NavigateDirection.Prev;

      to += direction;

      if (from === CaretNavigateFrom.Child) {
        // 从子区域跳入
        if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
          // 超出该方向的尾边界，则跳过
          return CaretNavigateEnterDecision.Skip;
        }
        // 进入下一个子区域，注意前向时索引需要-1
        return CaretNavigateEnterDecision.EnterChild(to_prev ? to - 1 : to);
      } else if (from === CaretNavigateFrom.Parent) {
        // 根区域不应该从父区域进入
        throw new Error(
          "根区域顶层索引约定为无界，所以不可能从根区域顶层索引进入。这可能是插件直接设置了选区导致的错误选择了根区域的索引。"
        );
      } else {
        // 从自身索引移动（Self），根区域不应该有这种情况
        throw new Error("根区域不应该有自身索引移动的情况");
      }
    },
    handle_delete_range: paragraph_handle_delete_range,
  });

  // 注册文档节点加载行为
  saver.register_loader("document", async (tdo) => {
    const dtdo = tdo as DocumentTDO;
    const nodes = await Promise.all(
      dtdo.children.map((child) => saver.load_node_from_tdo(child))
    );
    const document = node_manager.create_node(create_DocumentNode, {
      children: nodes,
      schema_version: dtdo.schema_version,
      created_at: dtdo.created_at,
      modified_at: dtdo.modified_at,
    });
    for (const node of nodes) {
      node_manager.set_parent(node, document);
    }
    return document;
  });

  // 注册加载流程
  event_manager.add_handler("load", async (props) => {
    const new_document = (await saver.load_node_from_tdo(
      props.event.tdo
    )) as DocumentNode;
    document.set(new_document);
  });
}
