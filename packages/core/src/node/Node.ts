export type MaybeNode = Node | undefined;

export interface Node {
  type: string;
}

export class NodeContext {
  constructor(public node: Node) {}
}
