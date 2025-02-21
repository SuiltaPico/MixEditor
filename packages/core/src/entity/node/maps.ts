import { MaybePromise } from "@mixeditor/common";
import { ConvertHandlerMap } from "../../common/handler";
import { ItemHandlerMap } from "../../common/handler_manager";
import { MixEditor } from "../../mixeditor";
import {
  CaretNavigateStrategyConfig,
  DeleteFromPointStrategyConfig,
  DeleteRangeStrategyConfig,
  InsertNodesStrategyConfig,
  MergeNodeStrategyConfig,
} from "../../resp_chain";
import { NameToStrategyMap } from "../../strategy/strategy_manager";
import { MarkMap } from "../mark/mark";
import { Node } from "./node";
import { NodeTDO } from "./node_tdo";

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
  tdo: NodeTDO;
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
export interface NodeManagerHandlerMap<TNode extends Node = Node>
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
  split: NodeHandler<[indexes: number[]], NodeTDO[]>;
  /** 插入子节点 */
  insert_children: NodeHandler<[index: number, children: NodeTDO[]], void>;
  /** 删除子节点 */
  delete_children: NodeHandler<[from: number, to: number], NodeTDO[]>;
}

/** 节点管理器策略表。 */
export interface NodeManagerStrategyMap extends NameToStrategyMap {
  caret_navigate: CaretNavigateStrategyConfig;
  insert_nodes: InsertNodesStrategyConfig;
  delete_from_point: DeleteFromPointStrategyConfig;
  delete_range: DeleteRangeStrategyConfig;
  merge_node: MergeNodeStrategyConfig;
}
