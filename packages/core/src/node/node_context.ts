import { Node } from "./node";

export class NodeContext {
  constructor(
    public readonly node: Node,
    public parent?: Node
  ) {}
}
