export class NodeContext {
  /** 父节点上下文 */
  parent?: NodeContext;

  constructor(public node: Node, parent?: NodeContext) {
    this.parent = parent;
  }
}
