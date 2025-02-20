import { UlidIdGenerator } from "@mixeditor/common";
import {
  handler_manager_method_list,
  HandlerManager,
  ItemHandlerMap,
} from "../../common/handler_manager";
import { MixEditor } from "../../mixeditor";
import { TransferDataObject } from "./tdo";

type TDOHandlerManager<
  TTDOHandler extends ItemHandlerMap<MixEditor, TTDO> = any,
  TTDO extends TransferDataObject = TransferDataObject
> = HandlerManager<TTDOHandler, TTDO, TransferDataObject, MixEditor>;

/** 传输数据对象管理器 */
export class TDOManager<
  TTDOHandler extends ItemHandlerMap<MixEditor, TTDO> = any,
  TTDO extends TransferDataObject = TransferDataObject
> {
  /** 处理器管理器 */
  private handler_manager: TDOHandlerManager<TTDOHandler, TTDO>;

  register_handler!: TDOHandlerManager<TTDOHandler, TTDO>["register_handler"];
  register_handlers!: TDOHandlerManager<TTDOHandler, TTDO>["register_handlers"];
  get_handler!: TDOHandlerManager<TTDOHandler, TTDO>["get_handler"];
  execute_handler!: TDOHandlerManager<TTDOHandler, TTDO>["execute_handler"];

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
