import { MaybePromise, UlidIdGenerator } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../mixeditor";
import { TransferDataObject } from "./tdo";
import { Node } from "./node";

/** 节点处理器类型表。 */
export interface TDOHandlerMap<
  TTDO extends TransferDataObject = TransferDataObject
> extends ItemHandlerMap<MixEditor, TTDO> {
  load(editor: MixEditor, tdo: TTDO): MaybePromise<Node>;
}

type TDOHandlerManager<
  TTDOHandler extends TDOHandlerMap<any> = any,
  TTDO extends TransferDataObject = TransferDataObject
> = HandlerManager<TTDOHandler, TTDO, TransferDataObject, MixEditor>;

/** 节点管理器 */
export class TDOManager<
  TTDOHandler extends TDOHandlerMap<any> = any,
  TTDO extends TransferDataObject = TransferDataObject
> {
  /** 节点 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 处理器管理器 */
  private handler_manager: TDOHandlerManager<TTDOHandler, TTDO>;

  register_handler!: TDOHandlerManager<TTDOHandler, TTDO>["register_handler"];
  register_handlers!: TDOHandlerManager<TTDOHandler, TTDO>["register_handlers"];
  get_handler!: TDOHandlerManager<TTDOHandler, TTDO>["get_handler"];
  execute_handler!: TDOHandlerManager<TTDOHandler, TTDO>["execute_handler"];

  /** 获取节点 ID */
  generate_id() {
    return this.idgen.next();
  }

  load(tdo: TTDO) {
    return (
      this.execute_handler as TDOManager<
        TDOHandlerMap<any>,
        TTDO
      >["execute_handler"]
    )("load", tdo);
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TTDOHandler,
      TTDO,
      TTDO,
      MixEditor
    >(this.editor);
    this.register_handlers = this.handler_manager.register_handlers.bind(
      this.handler_manager
    );
    this.register_handler = this.handler_manager.register_handler.bind(
      this.handler_manager
    );
    this.get_handler = this.handler_manager.get_handler.bind(
      this.handler_manager
    );
    this.execute_handler = this.handler_manager.execute_handler.bind(
      this.handler_manager
    );
  }
}
