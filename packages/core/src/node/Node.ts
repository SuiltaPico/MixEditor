import { DocumentNode } from "./nodes/document";

export type MaybeNode = Node | undefined;

/** 编辑器的内容单元。 */
export interface Node {
  /** 节点唯一标识。*/
  id: string;
  /** 节点类型。*/
  type: string;
}

export interface AllNodes {
  document: DocumentNode;
}

export type AllNodeTypes = AllNodes[keyof AllNodes];
