import { Node } from "./node";

/** 节点上下文。用于记录节点在树中的附加信息。 */
export class NodeContext {
  constructor(
    public readonly node: Node,
    public parent?: Node
  ) {}
}
