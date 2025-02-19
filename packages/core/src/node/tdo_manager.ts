import { UlidIdGenerator } from "@mixeditor/common";
import { ConvertHandlerMap } from "../common/handler";
import {
  handler_manager_method_list,
  HandlerManager,
  ItemHandlerMap,
} from "../common/HandlerManager";
import { MixEditor } from "../mixeditor";
import { Node } from "./node";
import { TransferDataObject } from "./tdo";

/** 传输数据对象转换格式映射接口 */
export interface TDOConvertFormatMap {
  /** 转换为节点格式 */
  node: Node;
}

/** 传输数据对象转换格式类型 */
export type TDOConvertFormat = keyof TDOConvertFormatMap;

/** 传输数据对象转换处理器映射类型 */
type TDOConvertHandlerMap = ConvertHandlerMap<
  TDOConvertFormatMap,
  [editor: MixEditor, tdo: TransferDataObject]
>;

/** 传输数据对象处理器类型表。 */
export interface TDOHandlerMap<
  TTDO extends TransferDataObject = TransferDataObject
> extends ItemHandlerMap<MixEditor, TTDO>,
    TDOConvertHandlerMap {}

type TDOHandlerManager<
  TTDOHandler extends TDOHandlerMap<any> = any,
  TTDO extends TransferDataObject = TransferDataObject
> = HandlerManager<TTDOHandler, TTDO, TransferDataObject, MixEditor>;

/** 传输数据对象管理器 */
export class TDOManager<
  TTDOHandler extends TDOHandlerMap<any> = any,
  TTDO extends TransferDataObject = TransferDataObject
> {
  /** 传输数据对象 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 处理器管理器 */
  private handler_manager: TDOHandlerManager<TTDOHandler, TTDO>;

  register_handler!: TDOHandlerManager<TTDOHandler, TTDO>["register_handler"];
  register_handlers!: TDOHandlerManager<TTDOHandler, TTDO>["register_handlers"];
  get_handler!: TDOHandlerManager<TTDOHandler, TTDO>["get_handler"];
  execute_handler!: TDOHandlerManager<TTDOHandler, TTDO>["execute_handler"];

  /** 获取传输数据对象 ID */
  generate_id() {
    return this.idgen.next();
  }

  convert_to_node(tdo: TTDO) {
    return (
      this.execute_handler as TDOManager<
        TDOHandlerMap<any>,
        TTDO
      >["execute_handler"]
    )("convert_to_node", tdo);
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TTDOHandler,
      TTDO,
      TTDO,
      MixEditor
    >(this.editor);

    for (const method_name of handler_manager_method_list) {
      this[method_name] = this.handler_manager[method_name].bind(
        this.handler_manager
      ) as any;
    }
  }
}
