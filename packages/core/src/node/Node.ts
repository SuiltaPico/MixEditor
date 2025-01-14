import { DocumentNode } from "./document";

export type MaybeNode = Node | undefined;

export interface Node {
  type: string;
}

export interface AllNodes {
  document: DocumentNode;
}

export type AllNodeTypes = AllNodes[keyof AllNodes];
