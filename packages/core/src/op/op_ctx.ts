import { UlidIdGenerator } from "@mixeditor/common";
import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../common/behavior";
import { bind_methods } from "../common/object";
import { Op } from "./op";
import { OpBehaviorMap } from "./op_behavior";
import { OpExecutor } from "./op_executor";
import { RingBuffer } from "../common/data_struct/ring_buffer";

export type OpMap = {
  [key: string]: Op;
};

/** 操作上下文实现 */
export class OpCtx<
  TOpMap extends OpMap,
  TBehaviorMap extends OpBehaviorMap<TExCtx>,
  TExCtx extends any
> {
  ex_ctx: TExCtx;
  private behavior: BehaviorHandlerManager<TBehaviorMap, Op, TOpMap, TExCtx>;
  private id_generator = new UlidIdGenerator();
  executor: OpExecutor<RingBuffer<Op>>;

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
    this.executor = new OpExecutor<RingBuffer<Op>>(
      this as any,
      new RingBuffer<Op>(100)
    );
    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
