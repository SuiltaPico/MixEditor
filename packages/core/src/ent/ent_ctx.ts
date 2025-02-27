import { UlidIdGenerator } from "@mixeditor/common";
import {
  BehaviorHandlerManager,
  IBehaviorHandlerManager,
  IBehaviorHandlerManager_methods,
} from "../common/behavior";
import { bind_methods } from "../common/object";
import { TagManager } from "../common/tag_manager";
import { Ent } from "./ent";
import { EntBehaviorMap } from "./ent_behavior";

export type EntMap = {
  [key: string]: Ent;
};

/** 实体上下文。 */
export interface IEntCtx<
  TEnt extends Ent,
  TBehaviorMap extends EntBehaviorMap<TEnt>,
  TExCtx extends any
> extends IBehaviorHandlerManager<TEnt, TBehaviorMap, TExCtx> {
  ex_ctx: TExCtx;
  gen_id: () => string;
}

export type EntMapOfIEntCtx<T extends IEntCtx<any, any, any>> =
  T extends IEntCtx<infer TEnt, any, any> ? { [key: string]: TEnt } : never;

/** 实体上下文。 */
export class EntCtx<
  TBehaviorMap extends EntBehaviorMap<any>,
  TEntMap extends EntMap,
  TExCtx extends any
> implements IEntCtx<TEntMap[keyof TEntMap], TBehaviorMap, TExCtx>
{
  ex_ctx: TExCtx;
  private behavior: BehaviorHandlerManager<
    TBehaviorMap,
    TEntMap[keyof TEntMap],
    TExCtx
  >;
  /** 实体标签集。 */
  private tag_manager: TagManager<keyof TEntMap>;
  /** 实体ID生成器。 */
  private id_generator = new UlidIdGenerator();

  /** 生成新的实体ID。 */
  gen_id() {
    return this.id_generator.next();
  }

  // BehaviorHandlerManager 接口的导出
  exec_behavior!: (typeof this.behavior)["exec_behavior"];
  register_handler!: (typeof this.behavior)["register_handler"];
  register_handlers!: (typeof this.behavior)["register_handlers"];
  get_handler!: (typeof this.behavior)["get_handler"];

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
    this.behavior = new BehaviorHandlerManager<
      TBehaviorMap,
      TEntMap[keyof TEntMap],
      TExCtx
    >(ex_ctx);
    this.tag_manager = new TagManager<keyof TEntMap>();

    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
