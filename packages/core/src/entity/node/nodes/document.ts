import * as Y from "yjs";
import { NavigateDirection } from "../../../common/navigate";
import { get_node_children } from "../../../common/entity/node/yjs";
import { MixEditor } from "../../../mixeditor";
import {
  CaretNavigateDecision,
  CaretNavigateSource,
} from "../../../resp_chain/caret_navigate";
import { AnyTDO } from "../../../saver/saver";
import { create_DynamicStrategy } from "../../../strategy/strategy";
import { MarkTDOMap } from "../../mark/mark_tdo";
import { TransferDataObject } from "../../tdo/tdo";
import {
  paragraph_delete_children,
  paragraph_delete_range_strategy,
} from "../handlers";
import { BaseNodeAttributes, Node, create_Node } from "../node";

/** 文档节点属性 */
export interface DocumentNodeAttributes extends BaseNodeAttributes {
  /** 创建时间 */
  created_at: number;
  /** 修改时间 */
  modified_at: number;
}

/** 文档节点。 */
export interface DocumentNode extends Node<DocumentNodeAttributes> {
  nodeName: "document";
}

export function create_DocumentNode(
  editor: MixEditor,
  id: string,
  params: Partial<
    Omit<DocumentNodeAttributes, "id"> & {
      children: Node[];
    }
  >
): DocumentNode {
  const attrs: DocumentNodeAttributes = {
    id,
    created_at: params.created_at ?? Date.now(),
    modified_at: params.modified_at ?? Date.now(),
  };
  return create_Node(editor.ydoc, "document", attrs) as DocumentNode;
}

/** 文档传输数据对象 */
export interface DocumentTDO extends TransferDataObject {
  type: "document";
  created_at: number;
  modified_at: number;
  children: AnyTDO[];
}

/** 创建文档传输数据对象 */
export function create_DocumentTDO(
  id: string,
  params: Partial<Omit<DocumentTDO, "id" | "type">> = {}
): DocumentTDO {
  return {
    id,
    type: "document",
    created_at: params.created_at ?? Date.now(),
    modified_at: params.modified_at ?? Date.now(),
    children: params.children ?? [],
  };
}

export async function to_tdo(editor: MixEditor, document: DocumentNode) {
  const attrs = document.getAttributes();
  return {
    id: attrs.id ?? "",
    type: "document",
    created_at: attrs.created_at ?? Date.now(),
    modified_at: attrs.modified_at ?? Date.now(),
    children: (
      await Promise.all(
        get_node_children(document).map((child) =>
          editor.node_manager.execute_handler("to_tdo", child)
        )
      )
    ).filter((tdo) => tdo !== undefined) as AnyTDO[],
  } satisfies DocumentTDO;
}

export async function init_document(editor: MixEditor) {
  const {
    node_manager,
    ydoc: document,
    node_tdo_manager,
    event_manager,
  } = editor;

  // 注册文档节点保存行为
  node_manager.register_handlers("document", {
    to_tdo,
  });

  node_manager.register_strategies("document", {
    caret_navigate: create_DynamicStrategy(
      (_, node, { from: to, direction, src }) => {
        const children_count = node.length;
        const to_prev = direction === NavigateDirection.Prev;

        to += direction;

        if (src === CaretNavigateSource.Child) {
          // 从子区域跳入
          if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
            // 超出该方向的尾边界，则跳过
            return CaretNavigateDecision.Skip;
          }
          // 进入下一个子区域，注意前向时索引需要-1
          return CaretNavigateDecision.EnterChild(to_prev ? to - 1 : to);
        } else if (src === CaretNavigateSource.Parent) {
          // 根区域不应该从父区域进入
          throw new Error(
            "根区域顶层索引约定为无界，所以不可能从根区域顶层索引进入。这可能是插件直接设置了选区导致的错误选择了根区域的索引。"
          );
        } else {
          // 从自身索引移动（Self），根区域不应该有这种情况
          throw new Error("根区域不应该有自身索引移动的情况");
        }
      }
    ),
    delete_range: paragraph_delete_range_strategy,
  });

  // 注册文档节点加载行为
  node_tdo_manager.register_handler("document", "to_node", async (_, tdo) => {
    const dtdo = tdo as DocumentTDO;
    const nodes = (
      await Promise.all(
        // TODO：缺失对没有注册或加载失败的节点的处理
        dtdo.children.map((child) =>
          node_tdo_manager.execute_handler("to_node", child)
        )
      )
    ).filter((node) => node !== undefined) as Node[];
    const document = node_manager.create_node(create_DocumentNode, dtdo.id, {
      children: nodes,
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
    const new_document = (await node_tdo_manager.execute_handler(
      "to_node",
      props.event.tdo
    )) as DocumentNode;
    document.set(new_document);
  });
}
