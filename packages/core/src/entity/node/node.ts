import { DocumentNode } from "./nodes/document";

/** 编辑器的内容单元。 */
export interface Node {
  /** 节点唯一标识。*/
  id: string;
  /** 节点类型。*/
  type: string;
  /** 是否是节点。*/
  _is_node: true;
  /** 是否是标记。 */
  _is_mark?: false;
}

/** 创建一个节点。 */
export function create_Node<T extends Node>(params: Omit<T, "_is_node">) {
  // @ts-ignore
  params._is_node = true;
  return params as T;
}

/** 判断一个对象是否是节点。 */
export function is_Node(maybe_node: any): maybe_node is Node {
  return maybe_node._is_node === true;
}

export interface AllNodes {
  document: DocumentNode;
}

export type AllNodeTypes = AllNodes[keyof AllNodes];
