import { MaybePromise } from "../common/promise";
import { TwoLevelTypeMap } from "../common/TwoLevelTypeMap";
import { ParametersExceptFirst, ParametersExceptFirst2 } from "../common/type";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "../saver";
import { Node } from "./Node";
import { TagManager } from "./TagManager";

/** Node 属性操作行为接口 */
export interface NodeBehavior<TNode extends Node = Node> {
  get_child(
    editor: MixEditor,
    node: TNode,
    index: number
  ): MaybePromise<TNode | undefined>;
  get_children(editor: MixEditor, node: TNode): MaybePromise<TNode[]>;
  get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
  clone(editor: MixEditor, node: TNode): MaybePromise<TNode>;
  slice(editor: MixEditor, node: TNode, from: number, to: number): MaybePromise<TNode>;
  handle_event(editor: MixEditor, node: TNode, event: any): MaybePromise<void>;
}

/** Node 属性未找到错误 */
export class NodeManagerNoPropertyError extends Error {
  constructor(public node_type: string, public property_name: string) {
    super(
      `No property behavior for node type: ${node_type}, property: ${property_name}`
    );
  }
}

function gen_run_node_behavior<
  TBehavior extends keyof TNodeBehavior,
  TNodeBehavior extends NodeBehavior = NodeBehavior
>(node_manager: NodeManager<TNodeBehavior>, behavior_name: TBehavior) {
  return function <TNode extends Node>(
    node: TNode,
    ...args: ParametersExceptFirst2<TNodeBehavior[TBehavior]>
  ) {
    const behavior = node_manager.get_property<TBehavior>(
      node.type,
      behavior_name
    );
    return (behavior as any)(
      node_manager.editor,
      node,
      ...args
    ) as TNodeBehavior[TBehavior] extends (...args: any) => any
      ? ReturnType<TNodeBehavior[TBehavior]>
      : never;
  };
}

export class NodeManager<TNodeBehavior extends NodeBehavior = NodeBehavior> {
  private node_behaviors = new TwoLevelTypeMap<TNodeBehavior>();
  private tag_manager = new TagManager<string>();

  /** 设置节点属性行为 */
  register_behavior<TBehavior extends keyof TNodeBehavior>(
    node_type: string,
    property_name: TBehavior,
    behavior: TNodeBehavior[TBehavior]
  ) {
    this.node_behaviors.set(property_name, node_type, behavior);
  }

  /** 获取节点属性行为 */
  get_property<TBehavior extends keyof TNodeBehavior>(
    node_type: string,
    property_name: TBehavior
  ): TNodeBehavior[TBehavior] {
    const behavior = this.node_behaviors.get(property_name, node_type);
    if (!behavior) {
      throw new NodeManagerNoPropertyError(node_type, property_name as string);
    }
    return behavior as TNodeBehavior[TBehavior];
  }

  /** 获取指定节点的指定索引的子节点 */
  get_child = gen_run_node_behavior<"get_child", TNodeBehavior>(
    this,
    "get_child"
  );

  /** 获取指定节点的所有子节点 */
  get_children = gen_run_node_behavior<"get_children", TNodeBehavior>(
    this,
    "get_children"
  );

  /** 获取指定节点的子节点数量 */
  get_children_count = gen_run_node_behavior<
    "get_children_count",
    TNodeBehavior
  >(this, "get_children_count");

  /** 将 Node 保存为 TransferDataObject */
  save = gen_run_node_behavior<"save", TNodeBehavior>(this, "save");

  /** 克隆一个 Node */
  clone = gen_run_node_behavior<"clone", TNodeBehavior>(this, "clone");

  /** 切割一个 Node */
  slice = gen_run_node_behavior<"slice", TNodeBehavior>(this, "slice");

  /** 处理指定节点的指定事件 */
  handle_event = gen_run_node_behavior<"handle_event", TNodeBehavior>(
    this,
    "handle_event"
  );

  constructor(public editor: MixEditor) {}
}
