import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../../common/behavior";
import { bind_methods } from "../../common/object";
import { MarkTDO } from "./tdo";
import { MarkBehaviorMap } from "../mark_behavior";

export type MarkTDOMap = {
  [key: string]: MarkTDO;
};

/** 标记TDO上下文。 */
export interface IMarkTDOCtx<
  TMarkTDOMap extends MarkTDOMap,
  TBehaviorMap extends MarkBehaviorMap<TExCtx>,
  TExCtx extends any
> extends IBehaviorHandlerManager<MarkTDO, TBehaviorMap, TMarkTDOMap, TExCtx> {
  ex_ctx: TExCtx;
}

export type MarkTDOMapOfIMarkTDOCtx<T extends IMarkTDOCtx<any, any, any>> =
  T extends IMarkTDOCtx<infer TMarkTDOMap, any, any> ? TMarkTDOMap : never;

/** 实体上下文。 */
export class MarkTDOCtx<
  TMarkTDOMap extends MarkTDOMap,
  TBehaviorMap extends MarkBehaviorMap<TExCtx>,
  TExCtx extends any
> implements IMarkTDOCtx<TMarkTDOMap, TBehaviorMap, TExCtx>
{
  ex_ctx: TExCtx;
  behavior: BehaviorHandlerManager<
    TBehaviorMap,
    MarkTDO,
    TMarkTDOMap,
    TExCtx
  >;

  // BehaviorHandlerManager 接口的导出
  exec_behavior!: (typeof this.behavior)["exec_behavior"];
  register_handler!: (typeof this.behavior)["register_handler"];
  register_handlers!: (typeof this.behavior)["register_handlers"];
  get_handler!: (typeof this.behavior)["get_handler"];

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
    this.behavior = new BehaviorHandlerManager<
      TBehaviorMap,
      MarkTDO,
      TMarkTDOMap,
      TExCtx
    >(ex_ctx);

    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
