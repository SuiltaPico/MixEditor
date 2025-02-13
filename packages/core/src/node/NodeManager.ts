import { MaybePromise } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "../saver";
import { Node } from "./Node";
import { NodeContext } from "./NodeContext";
import { TagManager } from "./TagManager";
import { CaretNavigateDirection, CaretNavigateEnterDecision } from "../resp_chain/caret_navigate";

/** 节点处理器类型表。 */
export interface NodeHandlerMap<TNode extends Node = Node>
  extends ItemHandlerMap<MixEditor, TNode> {
  /** 获取子节点 */
  get_child(
    editor: MixEditor,
    node: TNode,
    index: number
  ): MaybePromise<TNode | undefined>;
  /** 获取子节点数量 */
  get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
  /** 获取子节点索引 */
  get_index_of_child(
    editor: MixEditor,
    node: TNode,
    child: TNode
  ): MaybePromise<number>;
  /** 保存节点 */
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
  /** 节点切片 */
  slice(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TNode>;
  /** 移动节点 */
  caret_navigate_enter(
    editor: MixEditor,
    node: TNode,
    /** 移动目标索引 */
    to: number,
    /** 移动方向 */
    direction: CaretNavigateDirection,
    /** 移动来源 */
    from?: "child" | "parent"
  ): MaybePromise<CaretNavigateEnterDecision>;
}

type NodeManagerHandlerManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> = HandlerManager<TNodeHandler, TNode, Node, MixEditor>;

/** 获取节点祖先（不包含自身） */
export async function get_node_ancestors(
  node_manager: NodeManager<NodeHandlerMap<any>, any>,
  node: Node
) {
  let result: Node[] = [];
  let current: Node | undefined = node_manager.get_context(node)?.parent;
  while (current) {
    result.push(current);
    current = node_manager.get_context(current)?.parent;
  }
  return result.reverse();
}

/** 节点管理器 */
export class NodeManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> {
  /** 处理器管理器 */
  private handler_manager: NodeManagerHandlerManager<TNodeHandler, TNode>;
  /** 标签管理器 */
  private tag_manager = new TagManager<string>();
  /** 节点上下文 */
  private node_contexts = new WeakMap<Node, NodeContext>();

  register_handler!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["register_handler"];
  register_handlers!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["register_handlers"];
  get_handler!: NodeManagerHandlerManager<TNodeHandler, TNode>["get_handler"];
  execute_handler!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["execute_handler"];

  /** 设置节点父节点 */
  set_parent(node: Node, parent: Node) {
    const context = this.node_contexts.get(node);
    if (context) {
      context.parent = parent;
    } else {
      this.node_contexts.set(node, new NodeContext(node, parent));
    }
  }

  /** 获取节点上下文 */
  get_context(node: Node) {
    const context = this.node_contexts.get(node);
    return context;
  }

  /** 获取节点父节点 */
  get_parent(node: Node) {
    const context = this.node_contexts.get(node);
    return context?.parent;
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TNodeHandler,
      TNode,
      Node,
      MixEditor
    >(this.editor);
    this.register_handlers = this.handler_manager.register_handlers.bind(
      this.handler_manager
    );
    this.register_handler = this.handler_manager.register_handler.bind(
      this.handler_manager
    );
    this.get_handler = this.handler_manager.get_handler.bind(
      this.handler_manager
    );
    this.execute_handler = this.handler_manager.execute_handler.bind(
      this.handler_manager
    );
  }
}
