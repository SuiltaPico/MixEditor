import { MaybePromise, UlidIdGenerator } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../mixeditor";
import { ParametersExceptFirst } from "../common/type";

/** 操作。 */
export interface Operation<TData = any> {
  /** 操作的唯一标识。*/
  id: string;
  /** 操作的类型。*/
  type: string;

  /** 操作的数据。*/
  data: TData;

  /** 合并到哪个 Operation。*/
  merge_with?: string;
}

/** 操作的正在执行的行为。*/
export type OperationRunningBehavior = "execute" | "undo";

/** 操作执行结果。*/
export type OperationExecuteResult = {
  /** 是否不被记录。*/
  dont_record: boolean;
  /** 附加执行的操作。*/
  children: Operation[];
};

/** 操作处理器接口。 */
export interface OperationHandlerMap<TData = any>
  extends ItemHandlerMap<MixEditor, Operation<TData>> {
  /** 执行操作。*/
  execute(
    editor: MixEditor,
    operation: Operation<TData>
  ): MaybePromise<OperationExecuteResult | void>;
  /** 撤销操作。*/
  undo(editor: MixEditor, operation: Operation<TData>): MaybePromise<void>;
  /** 取消操作。*/
  cancel(
    editor: MixEditor,
    operation: Operation<TData>,
    /** 正在执行的操作行为。如果为空，则表示没有正在执行的行为。*/
    running_behavior?: OperationRunningBehavior
  ): MaybePromise<void>;
  /** 合并操作。*/
  merge(editor: MixEditor, operation: Operation<TData>): MaybePromise<boolean>;
  /** 处理错误。处理 `execute` 或者 `undo` 产生的错误，恢复文档至正确的状态。 */
  handle_error(
    editor: MixEditor,
    operation: Operation<TData>,
    error: Error
  ): MaybePromise<void>;
  /** 序列化操作。 */
  serialize(
    editor: MixEditor,
    operation: Operation<TData>
  ): MaybePromise<string>;
}

type OperationManagerHandlerManager<
  TOperationHandler extends OperationHandlerMap = any
> = HandlerManager<TOperationHandler, Operation, Operation, MixEditor>;

/** 操作管理器。
 *
 * 管理操作的行为。允许通过更改第一个泛型参数，来扩展操作行为的具体类型。
 */
export class OperationManager<
  TOperationHandler extends OperationHandlerMap = OperationHandlerMap
> {
  /** 操作 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 处理器管理器 */
  private handler_manager: HandlerManager<
    TOperationHandler,
    Operation,
    Operation,
    MixEditor
  >;

  register_handler!: OperationManagerHandlerManager<TOperationHandler>["register_handler"];
  register_handlers!: OperationManagerHandlerManager<TOperationHandler>["register_handlers"];
  get_handler!: OperationManagerHandlerManager<TOperationHandler>["get_handler"];
  execute_handler!: OperationManagerHandlerManager<TOperationHandler>["execute_handler"];

  /** 生成操作 ID */
  generate_id() {
    return this.idgen.next();
  }

  /** 创建操作 */
  create_operation<
    TOperationFactory extends (id: string, ...args: any[]) => Operation
  >(
    operation_factory: TOperationFactory,
    ...args: ParametersExceptFirst<TOperationFactory>
  ) {
    const id = this.generate_id();
    const operation = operation_factory(id, ...args);
    return operation;
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TOperationHandler,
      Operation,
      Operation,
      MixEditor
    >(this.editor);
    this.register_handler = this.handler_manager.register_handler.bind(
      this.handler_manager
    );
    this.register_handlers = this.handler_manager.register_handlers.bind(
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
