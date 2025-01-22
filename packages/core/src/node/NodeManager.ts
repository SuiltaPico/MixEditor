import { MaybePromise } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "../saver";
import { Node } from "./Node";
import { NodeContext } from "./NodeContext";
import { TagManager } from "./TagManager";

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
  /** 保存节点 */
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
  /** 切片节点 */
  slice(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TNode>;
}

type NodeManagerHandlerManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> = HandlerManager<TNodeHandler, TNode, Node, MixEditor>;

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

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TNodeHandler,
      TNode,
      Node,
      MixEditor
    >(this.editor);
    this.register_handlers = this.handler_manager.register_handlers;
    this.register_handler = this.handler_manager.register_handler;
    this.get_handler = this.handler_manager.get_handler;
    this.execute_handler = this.handler_manager.execute_handler;
  }
}
