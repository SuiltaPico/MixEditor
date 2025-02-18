import { UlidIdGenerator } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../mixeditor";
import { Mark } from "./mark";
import { ParametersExceptFirst } from "../common/type";
import { TransferDataObject } from "./tdo";

export type MarkHandler<TArgs extends any[], TResult> = (
  editor: MixEditor,
  mark: Mark,
  ...args: TArgs
) => TResult;

/** 节点处理器类型表。 */
export interface MarkHandlerMap<TMark extends Mark = Mark>
  extends ItemHandlerMap<MixEditor, TMark> {
  /** 表达当前标记是否与另一个标记相等。 */
  equal: MarkHandler<[other: TMark], boolean>;
  /** 保存节点 */
  save_to_tdo: MarkHandler<[], TransferDataObject>;
}

type MarkManagerHandlerManager<
  TMarkHandler extends MarkHandlerMap<any> = any,
  TMark extends Mark = Mark
> = HandlerManager<TMarkHandler, TMark, Mark, MixEditor>;

/** 节点管理器 */
export class MarkManager<
  TMarkHandler extends MarkHandlerMap<any> = any,
  TMark extends Mark = Mark
> {
  /** 节点 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 节点 ID 映射 */
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

  /** 获取节点 ID */
  generate_id() {
    return this.idgen.next();
  }

  /** 创建节点 */
  create_mark<TMarkFactory extends (id: string, ...args: any[]) => TMark>(
    mark_factory: TMarkFactory,
    ...args: ParametersExceptFirst<TMarkFactory>
  ) {
    const mark_id = this.idgen.next();
    const mark = mark_factory(mark_id, ...args);
    this.id_mark_map.set(mark_id, mark);
    return mark;
  }

  /** 获取节点 ID */
  get_node_by_id(node_id: string) {
    return this.id_mark_map.get(node_id);
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TMarkHandler,
      TMark,
      Mark,
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
