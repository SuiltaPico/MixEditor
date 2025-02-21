import * as Y from "yjs";
import { DocumentNode } from "./nodes/document";

/** 基础节点属性。 */
export type BaseNodeAttributes = {
  id: string;
};

/** 编辑器的内容单元。
 *
 * 类型可以从 nodeType 获取。
 */
export interface Node<TAttrs = any>
  extends Y.XmlElement<BaseNodeAttributes & TAttrs> {
  type: string;
}

/** 获取节点的属性。 */
export type NodeAttributes<TNode extends Node> = TNode extends Node<
  infer TAttrs
>
  ? TAttrs
  : never;

export interface AllNodes {
  document: DocumentNode;
}

export type AllNodeTypes = AllNodes[keyof AllNodes];

/** 创建一个节点。 */
export function create_Node<TNode extends Node>(
  ydoc: Y.Doc,
  type: string,
  params: NodeAttributes<TNode>
) {
  const node: TNode = ydoc.getXmlElement(type) as TNode;
  for (const key in params) {
    node.setAttribute(key, params[key]);
  }
  node.type = type;
  return node;
}

/** 判断一个对象是否是节点。 */
export function is_Node(maybe_node: any): maybe_node is Node {
  return maybe_node instanceof Y.XmlElement;
}
