import { UlidIdGenerator } from "@mixeditor/common";
import {
  handler_manager_method_list,
  HandlerManager,
  ItemHandlerMap,
} from "../common/HandlerManager";
import { MixEditor } from "../mixeditor";
import { Mark } from "./mark";
import { ParametersExceptFirst } from "../common/type";
import { TransferDataObject } from "./tdo";
import { ConvertHandlerMap } from "../common/handler";

export type MarkHandler<TArgs extends any[], TResult> = (
  editor: MixEditor,
  mark: Mark,
  ...args: TArgs
) => TResult;

/** 标记转换格式映射接口 */
export interface MarkConvertFormatMap {
  /** 转换为传输数据对象格式 */
  tdo: TransferDataObject;
}

/** 标记转换格式类型 */
export type MarkConvertFormat = keyof MarkConvertFormatMap;

/** 标记转换处理器映射类型 */
type MarkConvertHandlerMap = ConvertHandlerMap<
  MarkConvertFormatMap,
  [editor: MixEditor, mark: Mark]
>;

/** 标记处理器类型表。 */
export interface MarkHandlerMap<TMark extends Mark = Mark>
  extends ItemHandlerMap<MixEditor, TMark>,
    MarkConvertHandlerMap {
  /** 表达当前标记是否与另一个标记相等。 */
  equal: MarkHandler<[other: TMark], boolean>;
}

/** 标记管理器的处理器管理器类型 */
type MarkManagerHandlerManager<
  TMarkHandler extends MarkHandlerMap<any> = any,
  TMark extends Mark = Mark
> = HandlerManager<TMarkHandler, TMark, Mark, MixEditor>;

/** 标记管理器 */
export class MarkManager<
  TMarkHandler extends MarkHandlerMap<any> = any,
  TMark extends Mark = Mark
> {
  /** 标记 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 标记 ID 映射 */
  private id_mark_map = new Map<string, Mark>();
  /** 处理器管理器 */
  private handler_manager: MarkManagerHandlerManager<TMarkHandler, TMark>;

  register_handler!: MarkManagerHandlerManager<
    TMarkHandler,
    TMark
  >["register_handler"];
  register_handlers!: MarkManagerHandlerManager<
    TMarkHandler,
    TMark
  >["register_handlers"];
  get_handler!: MarkManagerHandlerManager<TMarkHandler, TMark>["get_handler"];
  execute_handler!: MarkManagerHandlerManager<
    TMarkHandler,
    TMark
  >["execute_handler"];

  /** 获取标记 ID */
  generate_id() {
    return this.idgen.next();
  }

  /** 创建标记 */
  create_mark<TMarkFactory extends (id: string, ...args: any[]) => TMark>(
    mark_factory: TMarkFactory,
    ...args: ParametersExceptFirst<TMarkFactory>
  ) {
    const mark_id = this.idgen.next();
    const mark = mark_factory(mark_id, ...args);
    this.id_mark_map.set(mark_id, mark);
    return mark;
  }

  /** 获取标记 */
  get_mark_by_id(mark_id: string) {
    return this.id_mark_map.get(mark_id);
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TMarkHandler,
      TMark,
      Mark,
      MixEditor
    >(this.editor);
    for (const method_name of handler_manager_method_list) {
      this[method_name] = this.handler_manager[method_name].bind(
        this.handler_manager
      ) as any;
    }
  }
}
