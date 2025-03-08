import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../../common/behavior";
import { bind_methods } from "../../common/object";
import { EntTDO } from "./tdo";
import { EntTDOBehaviorMap } from "./tdo_behavior";

export type EntTDOMap = {
  [key: string]: EntTDO;
};

/** 实体上下文。 */
export interface IEntTDOCtx<
  TEntTDOMap extends EntTDOMap,
  TBehaviorMap extends EntTDOBehaviorMap<TExCtx>,
  TExCtx extends any
> extends IBehaviorHandlerManager<EntTDO, TBehaviorMap, TEntTDOMap, TExCtx> {
  ex_ctx: TExCtx;
}

export type EntTDOMapOfIEntTDOCtx<T extends IEntTDOCtx<any, any, any>> =
  T extends IEntTDOCtx<infer TEntTDOMap, any, any> ? TEntTDOMap : never;

/** 实体上下文。 */
export class EntTDOCtx<
  TEntTDOMap extends EntTDOMap,
  TBehaviorMap extends EntTDOBehaviorMap<TExCtx>,
  TExCtx extends any
> implements IEntTDOCtx<TEntTDOMap, TBehaviorMap, TExCtx>
{
  ex_ctx: TExCtx;
  behavior: BehaviorHandlerManager<
    TBehaviorMap,
    EntTDO,
    TEntTDOMap,
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
      EntTDO,
      TEntTDOMap,
      TExCtx
    >(ex_ctx);

    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
