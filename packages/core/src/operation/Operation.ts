import {
  Handler,
  HandlerManager,
  ItemHandlerMap,
} from "../common/HandlerManager";
import { TwoLevelTypeMap } from "../common/TwoLevelTypeMap";
import { ParametersExceptFirst } from "../common/type";
import { MixEditor } from "../MixEditor";

/** 操作。 */
export interface Operation<TData = any> {
  /** 操作的唯一标识。*/
  id: string;
  /** 操作的类型。*/
  type: string;

  /** 操作的数据。*/
  data: TData;

  /** 操作所基于的版本。*/
  version: number;
  /** 合并到哪个 Operation。*/
  merge_with?: string;
}

/** 操作的正在执行的行为。*/
export type OperationRunningBehavior = "execute" | "undo";

/** 操作处理器接口。 */
export interface OperationHandlerMap<TData = any>
  extends ItemHandlerMap<MixEditor, Operation<TData>> {
  /** 执行操作。*/
  execute(editor: MixEditor, operation: Operation<TData>): void | Promise<void>;
  /** 撤销操作。*/
  undo(editor: MixEditor, operation: Operation<TData>): void | Promise<void>;
  /** 取消操作。*/
  cancel(
    editor: MixEditor,
    operation: Operation<TData>,
    /** 正在执行的操作行为。如果为空，则表示没有正在执行的行为。*/
    running_behavior?: OperationRunningBehavior
  ): void | Promise<void>;
  /** 合并操作。*/
  merge(
    editor: MixEditor,
    operation: Operation<TData>
  ): boolean | Promise<boolean>;
  /** 处理错误。处理 `execute` 或者 `undo` 产生的错误，恢复文档至正确的状态。 */
  handle_error(
    editor: MixEditor,
    operation: Operation<TData>,
    error: Error
  ): void | Promise<void>;
  /** 序列化操作。 */
  serialize(
    editor: MixEditor,
    operation: Operation<TData>
  ): string | Promise<string>;
}

function gen_run_operation_behavior<
  TBehavior extends keyof TOperationBehavior,
  TOperationBehavior extends OperationHandlerMap = OperationHandlerMap
>(
  operation_manager: OperationManager<TOperationBehavior>,
  behavior_name: TBehavior
) {
  return function <TData>(
    operation: Operation<TData>,
    ...args: ParametersExceptFirst<TOperationBehavior[TBehavior]>
  ) {
    const behavior = operation_manager.get_handler<TBehavior>(
      operation.type,
      behavior_name
    );
    return (behavior as any)(
      operation,
      ...args
    ) as TOperationBehavior[TBehavior] extends (...args: any) => any
      ? ReturnType<TOperationBehavior[TBehavior]>
      : never;
  };
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

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TOperationHandler,
      Operation,
      Operation,
      MixEditor
    >(this.editor);
    this.register_handler = this.handler_manager.register_handler;
    this.register_handlers = this.handler_manager.register_handlers;
    this.get_handler = this.handler_manager.get_handler;
    this.execute_handler = this.handler_manager.execute_handler;
  }
}
