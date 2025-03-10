import { UlidIdGenerator } from "@mixeditor/common";
import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../common/behavior";
import { bind_methods } from "../common/object";
import { TagManager } from "../common/tag_manager";
import { Mark } from "./mark";
import { MarkBehaviorMap } from "./mark_behavior";

export type MarkMap = {
  [key: string]: Mark;
};

/** 标记上下文。 */
export interface IMarkCtx<
  TMarkMap extends MarkMap,
  TBehaviorMap extends MarkBehaviorMap<TExCtx>,
  TExCtx extends any
> extends IBehaviorHandlerManager<Mark, TBehaviorMap, TMarkMap, TExCtx> {
  ex_ctx: TExCtx;
}

export type MarkMapOfIMarkCtx<T extends IMarkCtx<any, any, any>> =
  T extends IMarkCtx<infer TMarkMap, any, any> ? TMarkMap : never;

/** 标记上下文。 */
export class MarkCtx<
  TMarkMap extends MarkMap,
  TBehaviorMap extends MarkBehaviorMap<TExCtx>,
  TExCtx extends any
> implements IMarkCtx<TMarkMap, TBehaviorMap, TExCtx>
{
  ex_ctx: TExCtx;
  protected behavior: BehaviorHandlerManager<
    TBehaviorMap,
    Mark,
    TMarkMap,
    TExCtx
  >;
  /** 标记标签集。 */
  private tag_manager: TagManager<keyof TMarkMap>;

  // BehaviorHandlerManager 接口的导出
  exec_behavior!: (typeof this.behavior)["exec_behavior"];
  register_handler!: (typeof this.behavior)["register_handler"];
  register_handlers!: (typeof this.behavior)["register_handlers"];
  get_handler!: (typeof this.behavior)["get_handler"];

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
    this.behavior = new BehaviorHandlerManager<
      TBehaviorMap,
      Mark,
      TMarkMap,
      TExCtx
    >(ex_ctx);
    this.tag_manager = new TagManager<keyof TMarkMap>();

    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
