import { ConvertHandlerMap } from "../../common/handler";
import { ItemHandlerMap } from "../../common/HandlerManager";
import { MixEditor } from "../../mixeditor";
import { TransferDataObject } from "../tdo/tdo";
import { TDOManager } from "../tdo/tdo_manager";
import { Node } from "./node";

/** 节点的传输数据对象。 */
export interface NodeTDO extends TransferDataObject {}

/** 传输数据对象转换格式映射接口 */
export interface NodeTDOConvertFormatMap {
  /** 转换为节点格式 */
  node: Node;
}

/** 传输数据对象转换格式类型 */
export type NodeTDOConvertFormat = keyof NodeTDOConvertFormatMap;

/** 传输数据对象转换处理器映射类型 */
type NodeTDOConvertHandlerMap = ConvertHandlerMap<
  NodeTDOConvertFormatMap,
  [editor: MixEditor, tdo: TransferDataObject]
>;

/** 传输数据对象处理器类型表。 */
export interface NodeTDOHandlerMap<TNodeTDO extends NodeTDO = NodeTDO>
  extends ItemHandlerMap<MixEditor, TNodeTDO>,
    NodeTDOConvertHandlerMap {}

export class NodeTDOHandlerManager<
  TNodeTDOHandler extends NodeTDOHandlerMap<any> = any,
  TNodeTDO extends NodeTDO = NodeTDO
> extends TDOManager<TNodeTDOHandler, TNodeTDO> {
  constructor(public editor: MixEditor) {
    super(editor);
  }
}
