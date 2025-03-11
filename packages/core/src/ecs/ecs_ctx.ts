import { UlidIdGenerator } from "@mixeditor/common";
import { Ent } from "./ent";
import { Compo, CompoTDO } from "./compo";
import { BehaviorHandler, BehaviorHandlerManager } from "../common/behavior";
import { TwoLevelTypeMap } from "../common/data_struct/two_level_type_map";
import { TDO } from "../tdo";
import { EntTDO } from "../../dist";

export type CompoBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx
> = BehaviorHandler<Compo, TParams, TResult, TExCtx>;

export type EntBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx
> = BehaviorHandler<Ent, TParams, TResult, TExCtx>;

export type EntBehaviorMap<TExCtx> = Record<
  string,
  EntBehaviorHandler<any, any, TExCtx>
> & {
  /** 实体初始化。 */
  init: EntBehaviorHandler<{}, void, TExCtx>;
  /** 实体转换为 TDO。 */
  to_tdo: EntBehaviorHandler<{}, EntTDO, TExCtx>;
  /** TDO 转换为实体。 */
  from_tdo: EntBehaviorHandler<EntTDO, void, TExCtx>;
};
export type CompoBehaviorMap<TExCtx> = Record<
  string,
  CompoBehaviorHandler<any, any, TExCtx>
> & {
  /** 组件转换为 TDO。 */
  to_tdo: CompoBehaviorHandler<{}, CompoTDO, TExCtx>;
  /** TDO 转换为组件。 */
  from_tdo: CompoBehaviorHandler<CompoTDO, void, TExCtx>;
};

/** 实体上下文。 */
export class ECSCtx<
  TCompoMap extends Record<string, Compo>,
  TCompoBehaviorMap extends CompoBehaviorMap<TExCtx>,
  TEntBehaviorMap extends EntBehaviorMap<TExCtx>,
  TExCtx extends any
> {
  /** 实体ID生成器。 */
  protected id_generator = new UlidIdGenerator();

  /** 实体表。 */
  public ents = new Map<string, Ent>();

  /** 实体组件表。`实体ID -> 组件类型 -> 组件`。 */
  // 不使用 `组件类型 -> 实体ID -> 组件` 是因为增减实体ID时
  // 可能会导致 JS 引擎重建所有 `实体ID -> 组件` 的索引
  protected compos = new TwoLevelTypeMap<string, string, Compo>();

  /** 组件行为表。记录组件的行为。 */
  protected compo_behaviors: BehaviorHandlerManager<
    TCompoBehaviorMap,
    Compo,
    TCompoMap,
    TExCtx
  >;
  /** 实体行为表。记录实体的行为。 */
  protected ent_behaviors: BehaviorHandlerManager<
    TEntBehaviorMap,
    Ent,
    Record<string, Ent>,
    TExCtx
  >;

  // ------- 工具函数 -------
  gen_ent_id() {
    return this.id_generator.next();
  }

  // ------- 行为 -------
  // ---- 组件 ----
  set_compo_behavior!: (typeof this.compo_behaviors)["register_handler"];
  get_compo_behavior!: (typeof this.compo_behaviors)["get_handler"];
  run_compo_behavior!: (typeof this.compo_behaviors)["exec_behavior"];
  // ---- 实体 ----
  set_ent_behavior!: (typeof this.ent_behaviors)["register_handler"];
  get_ent_behavior!: (typeof this.ent_behaviors)["get_handler"];
  run_ent_behavior!: (typeof this.ent_behaviors)["exec_behavior"];

  // ------- 实体方法 -------
  /** 获取实体。 */
  get_ent(ent_id: string) {
    return this.ents.get(ent_id);
  }

  /** 创建实体。 */
  async create_ent(ent_type: string) {
    const id = this.gen_ent_id();
    const ent = new Ent(id, ent_type);
    await this.run_ent_behavior(
      ent,
      "init",
      {} as Omit<Parameters<TEntBehaviorMap[any]>[0], "it" | "ex_ctx">
    );
    this.ents.set(id, ent);
    return ent;
  }

  /** 删除实体。 */
  delete_ent(ent_id: string) {
    this.ents.delete(ent_id);
    this.compos.delete_master(ent_id);
  }

  // ------- 组件方法 -------
  /** 获取组件。 */
  get_compo<TCompoType extends Extract<keyof TCompoMap, string> | string>(
    ent_id: string,
    compo_type: TCompoType
  ) {
    return this.compos.get(
      ent_id,
      compo_type
    ) as TCompoType extends keyof TCompoMap ? TCompoMap[TCompoType] : unknown;
  }

  /** 设置组件。 */
  set_compo<TCompoType extends Extract<keyof TCompoMap, string>>(
    ent_id: string,
    compo_type: TCompoType,
    compo: TCompoType extends keyof TCompoMap ? TCompoMap[TCompoType] : any
  ) {
    this.compos.set(ent_id, compo_type, compo);
  }

  /** 删除组件。 */
  delete_compo(ent_id: string, compo_type: string) {
    this.compos.delete(ent_id, compo_type);
  }

  constructor(public ex_ctx: TExCtx) {
    this.compo_behaviors = new BehaviorHandlerManager<
      TCompoBehaviorMap,
      Compo,
      TCompoMap,
      TExCtx
    >(this.ex_ctx);
    this.ent_behaviors = new BehaviorHandlerManager<
      TEntBehaviorMap,
      Ent,
      Record<string, Ent>,
      TExCtx
    >(this.ex_ctx);
  }
}
