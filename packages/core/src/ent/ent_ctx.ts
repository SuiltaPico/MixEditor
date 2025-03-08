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

/** 领域上下文。 */
export type DomainCtxMap = {
  [key: string]: any;
};

/** 实体上下文。 */
// export interface IEntCtx<
//   TEntMap extends EntMap,
//   TBehaviorMap extends EntBehaviorMap<TExCtx>,
//   TExCtx extends any
// > extends IBehaviorHandlerManager<Ent, TBehaviorMap, TEntMap, TExCtx> {
//   ex_ctx: TExCtx;
//   gen_id: () => string;
// }

export type EntMapOfEntCtx<T extends EntCtx<any, any, any, any>> =
  T extends EntCtx<infer TEntMap, any, any, any> ? TEntMap : never;

/** 实体上下文。 */
export class EntCtx<
  TEntMap extends EntMap,
  TBehaviorMap extends EntBehaviorMap<TExCtx>,
  TDomainCtxMap extends DomainCtxMap,
  TExCtx extends any
> {
  //  implements IEntCtx<TEntMap, TBehaviorMap, TExCtx>
  ex_ctx: TExCtx;
  protected behavior: BehaviorHandlerManager<
    TBehaviorMap,
    Ent,
    TEntMap,
    TExCtx
  >;
  /** 实体标签集。 */
  private tag_manager: TagManager<keyof TEntMap>;
  /** 实体ID生成器。 */
  private id_generator = new UlidIdGenerator();
  /** 领域上下文。 */
  private domains = new Map<
    string,
    Map<Ent, TDomainCtxMap[keyof TDomainCtxMap]>
  >();

  /** 生成新的实体ID。 */
  gen_id() {
    return this.id_generator.next();
  }

  // BehaviorHandlerManager 接口的导出
  exec_behavior!: (typeof this.behavior)["exec_behavior"];
  register_handler!: (typeof this.behavior)["register_handler"];
  register_handlers!: (typeof this.behavior)["register_handlers"];
  get_handler!: (typeof this.behavior)["get_handler"];

  /** 注册领域。 */
  register_domain(domain: string) {
    this.domains.set(domain, new Map());
  }
  /** 注销领域。 */
  unregister_domain(domain: string) {
    this.domains.delete(domain);
  }
  /** 设置领域上下文。 */
  set_domain_ctx<TDomainId extends Extract<keyof TDomainCtxMap, string>>(
    ent: Ent,
    domain: TDomainId,
    ctx: TDomainCtxMap[TDomainId]
  ) {
    const domain_ctx = this.domains.get(domain);
    domain_ctx!.set(ent, ctx);
  }
  /** 获取领域上下文。 */
  get_domain_ctx<TDomainId extends Extract<keyof TDomainCtxMap, string>>(
    ent: Ent,
    domain: TDomainId
  ) {
    const domain_ctx = this.domains.get(domain);
    return domain_ctx!.get(ent) as TDomainCtxMap[TDomainId] | undefined;
  }

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
    this.behavior = new BehaviorHandlerManager<
      TBehaviorMap,
      Ent,
      TEntMap,
      TExCtx
    >(ex_ctx);
    this.tag_manager = new TagManager<keyof TEntMap>();

    bind_methods(this, this.behavior, IBehaviorHandlerManager_methods);
  }
}
