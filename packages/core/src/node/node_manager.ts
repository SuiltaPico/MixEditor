import { MaybePromise, UlidIdGenerator } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { NavigateDirection } from "../common/navigate";
import { ParametersExceptFirst } from "../common/type";
import { MixEditor } from "../mixeditor";
import { CaretNavigateEnterDecision } from "../resp_chain/caret_navigate";
import { DeleteFromPointDecision } from "../resp_chain/delete_from_point";
import { DeleteRangeDecision } from "../resp_chain/delete_range";
import {
  InsertNodeFrom,
  InsertNodesDecision,
} from "../resp_chain/insert_nodes";
import { MergeNodeDecision } from "../resp_chain/merge_node";
import { MarkMap } from "./mark";
import { Node } from "./node";
import { NodeContext } from "./node_context";
import { TransferDataObject } from "./tdo";
import { ConvertHandlerMap } from "../common/handler";

/**
 * 节点处理器函数类型定义
 * @template TParams 处理器参数类型数组
 * @template TResult 处理器返回结果类型
 */
export type NodeHandler<TParams extends any[] = any[], TResult = void> = (
  editor: MixEditor,
  node: Node,
  ...params: TParams
) => MaybePromise<TResult>;

/**
 * 节点转换格式映射接口
 * 定义节点支持转换的目标格式及其对应的返回类型
 */
export interface NodeConvertFormatMap {
  /** 转换为纯文本格式 */
  plain_text: string;
  /** 转换为传输数据对象格式 */
  tdo: TransferDataObject;
}

/**
 * 节点转换格式类型
 * 表示支持的转换格式名称的联合类型
 */
export type NodeConvertFormat = keyof NodeConvertFormatMap;

/**
 * 节点转换处理器映射类型
 * 包含将节点转换为不同格式的具体处理方法
 */
type NodeConvertHandlerMap = ConvertHandlerMap<
  NodeConvertFormatMap,
  [editor: MixEditor, node: Node]
>;

/** 节点处理器类型表。 */
export interface NodeHandlerMap<TNode extends Node = Node>
  extends ItemHandlerMap<MixEditor, TNode>,
    NodeConvertHandlerMap {
  // --- 树结构访问 ---
  /** 获取子节点 */
  get_child: NodeHandler<[index: number], Node | undefined>;
  /** 获取子节点数量 */
  get_children_count: NodeHandler<[], number>;
  /** 获取子节点 */
  get_children: NodeHandler<[], Node[]>;
  /** 获取子节点索引 */
  get_index_of_child: NodeHandler<[child: Node], number>;

  // --- 标记管理 ---
  /** 获取节点标记 */
  get_marks: NodeHandler<[], MarkMap>;
  /** 设置节点标记 */
  set_marks: NodeHandler<[marks: MarkMap], void>;

  // --- 结构操作 ---
  /** 分离节点。
   *
   * 本节点应当是被分割的第一个节点。应该返回 [本节点, ...其余分割节点]。
   */
  split: NodeHandler<[indexes: number[]], Node[]>;
  /** 插入子节点 */
  insert_children: NodeHandler<
    [index: number, children: TransferDataObject[]],
    void
  >;
  /** 删除子节点 */
  delete_children: NodeHandler<
    [from: number, to: number],
    TransferDataObject[]
  >;

  // --- 责任链决策 ---
  /** 移动节点 */
  handle_caret_navigate: NodeHandler<
    [to: number, direction: NavigateDirection, from?: "child" | "parent"],
    CaretNavigateEnterDecision
  >;

  /** 插入节点。
   *
   * 处理器应当决定是否接受插入。然后产生操作以插入自己接受的节点，
   * 并返回自己不接受的节点。和自己插入流程完成后的索引，用于父节点分割自己。
   */
  handle_insert_nodes: NodeHandler<
    [
      insert_index: number,
      nodes_to_insert: TransferDataObject[],
      from?: InsertNodeFrom
    ],
    InsertNodesDecision
  >;

  /** 从点删除 */
  handle_delete_from_point: NodeHandler<
    [from: number, direction: NavigateDirection],
    DeleteFromPointDecision
  >;

  /** 删除范围 */
  handle_delete_range: NodeHandler<
    [from: number, to: number],
    DeleteRangeDecision
  >;

  /** 合并节点 */
  handle_merge_node: NodeHandler<[target: Node], MergeNodeDecision>;
}

/** 节点管理器的处理器管理器类型 */
type NodeManagerHandlerManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> = HandlerManager<TNodeHandler, TNode, Node, MixEditor>;

/** 节点管理器 */
export class NodeManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> {
  /** 节点 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 节点 ID 映射 */
  private id_node_map = new Map<string, Node>();
  /** 处理器管理器 */
  private handler_manager: NodeManagerHandlerManager<TNodeHandler, TNode>;
  /** 节点上下文 */
  private node_contexts = new WeakMap<Node, NodeContext>();
  /** 愿意被合并的节点。键为合并目标的标签，值为接受该标签合并的节点类型集合。 */
  private tag_allowed_to_be_merged = new Map<string, Set<string>>();

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

  /**
   * 设置节点类型允许被哪些标签合并。
   */
  set_merge_tags(
    /** 要配置的节点类型 */
    node_type: string,
    /** 要添加的允许合并标签（该类型节点愿意被这些标签的节点合并） */
    add_tags: Iterable<string>,
    /** 要移除的允许合并标签（可选） */
    remove_tags?: Iterable<string>
  ) {
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
    this.editor.tag_manager.set_tags_of_key(node_type, new Set(add_tags));
    if (remove_tags) {
      for (const tag of remove_tags) {
        this.editor.tag_manager.remove_tags_of_key(node_type, tag);
      }
    }
  }

  /** 获取节点 ID */
  generate_id() {
    return this.idgen.next();
  }

  /** 创建节点 */
  create_node<TNodeFactory extends (id: string, ...args: any[]) => TNode>(
    node_factory: TNodeFactory,
    ...args: ParametersExceptFirst<TNodeFactory>
  ) {
    const node_id = this.idgen.next();
    const node = node_factory(node_id, ...args);
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
    this.handler_manager = new HandlerManager<
      TNodeHandler,
      TNode,
      Node,
      MixEditor
    >(this.editor);

    /** 要代理的处理器管理器的方法 */
    const proxy_methods_list = [
      "register_handlers",
      "register_handler",
      "get_handler",
      "execute_handler",
    ] as const;

    for (const method_name of proxy_methods_list) {
      this[method_name] = this.handler_manager[method_name].bind(
        this.handler_manager
      ) as any;
    }
  }
}
