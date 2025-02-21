import {
  handler_manager_method_list,
  HandlerManager,
  ItemHandlerMap,
} from "../../common/handler_manager";
import { ParametersExceptFirst } from "../../common/type";
import { MixEditor } from "../../mixeditor";
import {
  strategy_manager_method_list,
  StrategyManager,
} from "../../strategy/strategy_manager";
import { NodeContext } from "./context";
import { NodeManagerHandlerMap, NodeManagerStrategyMap } from "./maps";
import { Node } from "./node";
import * as Y from "yjs";

/** 节点管理器的处理器管理器类型 */
type NodeManagerHandlerManager<
  TNodeHandler extends ItemHandlerMap<MixEditor, TNode> = any,
  TNode extends Node = Node
> = HandlerManager<TNodeHandler, TNode, Node, MixEditor>;

/** 节点管理器 */
export class NodeManager<
  TNode extends Node = Node,
  THandlerMap extends NodeManagerHandlerMap<TNode> = NodeManagerHandlerMap<TNode>,
  TStrategyMap extends NodeManagerStrategyMap = NodeManagerStrategyMap
> {
  /** 节点 ID 映射 */
  private id_node_map: Y.Map<string>;

  /** 处理器管理器 */
  private handler_manager: NodeManagerHandlerManager<THandlerMap, TNode>;
  /** 节点上下文 */
  private node_contexts = new WeakMap<Node, NodeContext>();
  /** 愿意被合并的节点。键为合并目标的标签，值为接受该标签合并的节点类型集合。 */
  private tag_allowed_to_be_merged = new Map<string, Set<string>>();
  /** 节点->允许接受的节点类型缓存。键为节点类型，值为节点类型集合。 */
  private node_to_merge_tags_cache = new Map<string, Set<string>>();
  /** 节点策略表 */
  private strategy_manager: StrategyManager<TNode, TStrategyMap, MixEditor>;

  register_handler!: NodeManagerHandlerManager<
    THandlerMap,
    TNode
  >["register_handler"];
  register_handlers!: NodeManagerHandlerManager<
    THandlerMap,
    TNode
  >["register_handlers"];
  get_handler!: NodeManagerHandlerManager<THandlerMap, TNode>["get_handler"];
  execute_handler!: NodeManagerHandlerManager<
    THandlerMap,
    TNode
  >["execute_handler"];

  register_strategy!: StrategyManager<
    TNode,
    TStrategyMap,
    MixEditor
  >["register_strategy"];
  register_strategies!: StrategyManager<
    TNode,
    TStrategyMap,
    MixEditor
  >["register_strategies"];
  get_strategy!: StrategyManager<
    TNode,
    TStrategyMap,
    MixEditor
  >["get_strategy"];
  get_decision!: StrategyManager<
    TNode,
    TStrategyMap,
    MixEditor
  >["get_decision"];

  /**
   * 设置节点类型允许被哪些标签合并。
   */
  set_mergeable_into_tags(
    /** 要配置的节点类型 */
    node_type: string,
    /** 要添加的允许合并标签（该类型节点愿意被这些标签的节点合并） */
    add_tags: Iterable<string>,
    /** 要移除的允许合并标签（可选） */
    remove_tags?: Iterable<string>
  ) {
    // 更改允许合并的标签会导致涉及的节点类型缓存失效。
    // 因为计算涉及的节点类型成本高，所以直接清空缓存。
    this.node_to_merge_tags_cache.clear();

    // 添加允许合并的标签
    for (const tag of add_tags) {
      let allowed_types = this.tag_allowed_to_be_merged.get(tag);
      if (!allowed_types) {
        allowed_types = new Set();
        this.tag_allowed_to_be_merged.set(tag, allowed_types);
      }
      allowed_types.add(node_type);
    }

    // 移除不再允许合并的标签
    if (remove_tags) {
      for (const tag of remove_tags) {
        const allowed_types = this.tag_allowed_to_be_merged.get(tag);
        allowed_types?.delete(node_type);
      }
    }
  }

  /** 设置节点标签。 */
  set_tag(
    /** 要设置标签的节点类型 */
    node_type: string,
    /** 要添加的标签 */
    add_tags: Iterable<string>,
    /** 要移除的标签（可选） */
    remove_tags?: Iterable<string>
  ) {
    // 更改自己的标签会导致自己允许合并的节点类型的缓存失效
    this.node_to_merge_tags_cache.delete(node_type);

    this.editor.tag_manager.set_tags_of_key(node_type, new Set(add_tags));
    if (remove_tags) {
      for (const tag of remove_tags) {
        this.editor.tag_manager.remove_tags_of_key(node_type, tag);
      }
    }
  }

  /** 生成合并比较器。 */
  is_allow_to_merge(
    /** 要比较的节点类型 */
    host_node_type: string,
    /** 要被合并的节点类型 */
    be_merged_node_type: string
  ) {
    let host_allowed_types = this.node_to_merge_tags_cache.get(host_node_type);
    // 计算节点允许合并的节点类型，并缓存结果
    if (!host_allowed_types) {
      const host_tags = this.editor.tag_manager.get_tags_of_key(host_node_type);
      if (!host_tags) return false;

      host_allowed_types = new Set<string>();
      for (const host_tag of host_tags) {
        const host_tag_allowed_types =
          this.tag_allowed_to_be_merged.get(host_tag);
        if (host_tag_allowed_types) {
          host_tag_allowed_types.forEach((type) =>
            host_tag_allowed_types.add(type)
          );
        }
      }
      this.node_to_merge_tags_cache.set(host_node_type, host_allowed_types);
    }

    return host_allowed_types.has(be_merged_node_type);
  }

  /** 创建节点 */
  create_node<
    TNodeFactory extends (
      editor: MixEditor,
      id: string,
      ...args: any[]
    ) => TNode
  >(node_factory: TNodeFactory, ...args: ParametersExceptFirst<TNodeFactory>) {
    const node_id = this.editor.gen_id();
    const node = node_factory(this.editor, node_id, ...args);
    this.id_node_map.set(node_id, node);
    return node;
  }

  /** 记录节点 */
  record_node(node: Node) {
    this.id_node_map.set(node.id, node);
  }

  /** 移除节点 */
  remove_node(node: Node) {
    this.id_node_map.delete(node.id);
  }

  /** 获取节点 ID */
  get_node_by_id(node_id: string) {
    return this.id_node_map.get(node_id);
  }

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
    this.id_node_map = editor.ydoc.getMap("id_node_map");
    this.handler_manager = new HandlerManager<
      THandlerMap,
      TNode,
      Node,
      MixEditor
    >(this.editor);
    for (const method_name of handler_manager_method_list) {
      this[method_name] = this.handler_manager[method_name].bind(
        this.handler_manager
      ) as any;
    }

    this.strategy_manager = new StrategyManager<TNode, TStrategyMap, MixEditor>(
      this.editor
    );
    for (const method_name of strategy_manager_method_list) {
      this[method_name] = this.strategy_manager[method_name].bind(
        this.strategy_manager
      ) as any;
    }
  }
}
