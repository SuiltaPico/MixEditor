import { Node } from "./Node";

export class NodeContext {
  constructor(public node: Node, public parent?: Node) {
    this.parent = parent;
  }
}
