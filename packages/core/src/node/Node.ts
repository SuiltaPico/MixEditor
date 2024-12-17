export type MaybeNode = Node | undefined;

export interface Node<TData = any> {
  type: string;
  data: TData;
}

export class NodeContext {
  constructor(public node: Node) {}
}
