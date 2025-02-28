import { UlidIdGenerator } from "@mixeditor/common";
import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../common/behavior";
import { bind_methods } from "../common/object";
import { Op } from "./op";
import { OpBehaviorMap } from "./op_behavior";

/** 操作上下文接口 */
export interface IOpCtx<
  TOpMap extends OpMap,
  TBehaviorMap extends OpBehaviorMap<TExCtx>,
  TExCtx extends any
> extends IBehaviorHandlerManager<Op, TBehaviorMap, TOpMap, TExCtx> {
  ex_ctx: TExCtx;
  gen_id: () => string;
}

export type OpMap = {
  [key: string]: Op;
};

/** 操作上下文实现 */
export class OpCtx<
  TOpMap extends OpMap,
  TBehaviorMap extends OpBehaviorMap<TExCtx>,
  TExCtx extends any
> implements IOpCtx<TOpMap, TBehaviorMap, TExCtx>
{
  ex_ctx: TExCtx;
  private behavior: BehaviorHandlerManager<TBehaviorMap, Op, TOpMap, TExCtx>;
  private id_generator = new UlidIdGenerator();

  gen_id() {
    return this.id_generator.next();
  }

  // 代理 BehaviorHandlerManager 的方法
  exec_behavior!: (typeof this.behavior)["exec_behavior"];
  register_handler!: (typeof this.behavior)["register_handler"];
  register_handlers!: (typeof this.behavior)["register_handlers"];
  get_handler!: (typeof this.behavior)["get_handler"];

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
    this.behavior = new BehaviorHandlerManager<
      TBehaviorMap,
      Op,
      TOpMap,
      TExCtx
    >(ex_ctx);
    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
