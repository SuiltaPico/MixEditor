import { TransferDataObject } from "../tdo/tdo";
import { ItemHandlerMap } from "../../common/HandlerManager";
import { MixEditor } from "../../mixeditor";
import { TDOManager } from "../tdo/tdo_manager";
import { ConvertHandlerMap } from "../../common/handler";
import { Mark } from "./mark";

/** 标记的传输数据对象。 */
export interface MarkTDO extends TransferDataObject {}

/** 标记TDO表。 */
export type MarkTDOMap = {
  [key: string]: MarkTDO;
};

/** 标记TDO的格式转换表。 */
export interface MarkTDOConvertFormatMap {
  /** 转换为标记格式 */
  mark: Mark;
}

/** 标记TDO的格式转换类型。 */
export type MarkTDOConvertFormat = keyof MarkTDOConvertFormatMap;

/** 标记TDO的处理器。 */
export type MarkTDOHandler<TArgs extends any[], TResult> = (
  editor: MixEditor,
  mark: Mark,
  ...args: TArgs
) => TResult;

/** 标记TDO的处理器表。 */
export interface MarkTDOHandlerMap
  extends ItemHandlerMap<MixEditor, MarkTDO>,
    ConvertHandlerMap<
      MarkTDOConvertFormatMap,
      [editor: MixEditor, tdo: TransferDataObject]
    > {}

/** 标记TDO的处理器管理器。 */
export class MarkTDOHandlerManager<
  TMarkTDOHandler extends MarkTDOHandlerMap = MarkTDOHandlerMap,
  TMarkTDO extends MarkTDO = MarkTDO
> extends TDOManager<TMarkTDOHandler, TMarkTDO> {
  constructor(public editor: MixEditor) {
    super(editor);
  }
}
