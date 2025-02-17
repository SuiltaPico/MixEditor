import { Node } from "./Node";

export class NodeContext {
  constructor(
    public readonly node: Node,
    public parent?: Node
  ) {}
}
