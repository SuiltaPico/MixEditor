import { MaybePromise } from "@mixeditor/common";
import { TwoLevelTypeMap } from "../common/TwoLevelTypeMap";
import { ParametersExceptFirst2 } from "../common/type";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "../saver";
import { Node } from "./Node";
import { TagManager } from "./TagManager";
import { NodeContext } from "./NodeContext";

/** Node 属性操作行为接口 */
export interface NodeBehavior<TNode extends Node = Node> {
  get_child(
    editor: MixEditor,
    node: TNode,
    index: number
  ): MaybePromise<TNode | undefined>;
  get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
  slice(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TNode>;
}

export type NodeOfNodeBehavior<TNodeBehavior extends NodeBehavior> =
  TNodeBehavior extends NodeBehavior<infer TNode> ? TNode : never;

/** Node 属性未找到错误 */
export class NodeManagerNoPropertyError extends Error {
  constructor(public node_type: string, public property_name: string) {
    super(
      `No property behavior for node type: ${node_type}, property: ${property_name}`
    );
  }
}

export class NodeManager<TNodeBehavior extends NodeBehavior = NodeBehavior> {
  /** 默认节点行为 */
  private default_node_behavior = new Map<string, TNodeBehavior>();
  /** 节点行为 */
  private node_behaviors = new TwoLevelTypeMap<TNodeBehavior>();
  /** 标签管理器 */
  private tag_manager = new TagManager<string>();
  /** 节点上下文 */
  private node_contexts = new WeakMap<Node, NodeContext>();


  /** 设置节点属性行为 */
  register_behavior<TBehavior extends keyof TNodeBehavior>(
    node_type: string,
    property_name: TBehavior,
    behavior: TNodeBehavior[TBehavior]
  ) {
    if (node_type === "*") {
      this.default_node_behavior.set(property_name as string, behavior as any);
    } else {
      this.node_behaviors.set(property_name, node_type, behavior);
    }
  }

  /** 为所有节点注册行为 */
  register_behaviors<
    TNodeType extends NodeOfNodeBehavior<TNodeBehavior>["type"],
    TBehaviors extends {
      [key in keyof NodeBehavior<
        NodeOfNodeBehavior<TNodeBehavior> & { type: TNodeType }
      >]?: NodeBehavior<
        NodeOfNodeBehavior<TNodeBehavior> & { type: TNodeType }
      >[key];
    }
  >(node_type: TNodeType, behaviors: TBehaviors) {
    for (const [property_name, behavior] of Object.entries(behaviors)) {
      this.node_behaviors.set(
        property_name as keyof TNodeBehavior,
        node_type,
        behavior as any
      );
    }
  }

  /** 获取节点属性行为 */
  get_property<TBehavior extends keyof TNodeBehavior>(
    node_type: string,
    behavior_name: TBehavior
  ): TNodeBehavior[TBehavior] {
    const behavior = this.node_behaviors.get(behavior_name, node_type);
    if (!behavior) {
      throw new NodeManagerNoPropertyError(node_type, behavior_name as string);
    }
    return behavior as TNodeBehavior[TBehavior];
  }

  execute_behavior<TBehavior extends keyof TNodeBehavior>(
    behavior_name: TBehavior,
    node: Node,
    ...args: ParametersExceptFirst2<TNodeBehavior[TBehavior]>
  ) {
    let behavior: TNodeBehavior[TBehavior] | undefined = this.get_property(
      node.type,
      behavior_name
    );
    if (!behavior) {
      behavior = this.default_node_behavior.get(node.type) as
        | TNodeBehavior[TBehavior]
        | undefined;
      if (!behavior) {
        throw new NodeManagerNoPropertyError(
          node.type,
          behavior_name as string
        );
      }
    }
    return (behavior as any)(
      this.editor,
      node,
      ...args
    ) as TNodeBehavior[TBehavior] extends (...args: any) => any
      ? ReturnType<TNodeBehavior[TBehavior]>
      : never;
  }

  constructor(public editor: MixEditor) {}
}
