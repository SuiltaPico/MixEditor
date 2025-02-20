import { MaybePromise } from "@mixeditor/common";
import { ConvertHandlerMap } from "../../common/handler";
import { ItemHandlerMap } from "../../common/handler_manager";
import { MixEditor } from "../../mixeditor";
import { MarkTDOMap } from "../mark/mark_tdo";
import { TransferDataObject } from "../tdo/tdo";
import { TDOManager } from "../tdo/tdo_manager";
import { Node } from "./node";
import { ParametersExceptFirst } from "../../common/type";

/** 节点的传输数据对象。 */
export interface NodeTDO extends TransferDataObject {}

/** 传输数据对象转换格式映射接口 */
export interface NodeTDOConvertFormatMap {
  /** 转换为节点格式 */
  node: Node;
  /** 转换为纯文本格式 */
  plain_text: string;
}

/** 传输数据对象转换格式类型 */
export type NodeTDOConvertFormat = keyof NodeTDOConvertFormatMap;

type NodeTDOHandler<TParams extends any[] = any[], TResult = void> = (
  editor: MixEditor,
  tdo: TransferDataObject,
  ...params: TParams
) => MaybePromise<TResult>;

/** 传输数据对象转换处理器映射类型 */
type NodeTDOConvertHandlerMap = ConvertHandlerMap<
  NodeTDOConvertFormatMap,
  [editor: MixEditor, tdo: TransferDataObject]
>;

/** 传输数据对象处理器类型表。 */
export interface NodeTDOHandlerMap<TNodeTDO extends NodeTDO = NodeTDO>
  extends ItemHandlerMap<MixEditor, TNodeTDO>,
    NodeTDOConvertHandlerMap {
  /** 获取节点标记 */
  get_marks: NodeTDOHandler<[], MarkTDOMap>;
}

export class NodeTDOHandlerManager<
  TNodeTDOHandler extends ItemHandlerMap<MixEditor, NodeTDO> = any,
  TNodeTDO extends NodeTDO = NodeTDO
> extends TDOManager<TNodeTDOHandler, TNodeTDO> {
  /** 创建传输数据对象。 */
  create_tdo<TTDOFactory extends (id: string, ...args: any[]) => TNodeTDO>(
    tdo_factory: TTDOFactory,
    ...args: ParametersExceptFirst<TTDOFactory>
  ) {
    return tdo_factory(this.editor.node_manager.gen_id(), ...args);
  }

  constructor(public editor: MixEditor) {
    super(editor);
  }
}
