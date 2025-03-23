import { UlidIdGenerator } from "@mixeditor/common";
import { BehaviorHandler, BehaviorHandlerManager } from "../common/behavior";
import { TwoLevelTypeMap } from "../common/data_struct/two_level_type_map";
import { Compo, CompoTDOList, CompoTDO } from "./compo";
import { Ent, EntTDO } from "./ent";

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

export type GetEntBehaviorHandlerParams<
  TEntBehaviorHandler extends EntBehaviorHandler<any, any, any>
> = TEntBehaviorHandler extends BehaviorHandler<Ent, infer TParams, any, any>
  ? TParams
  : never;

export const InitEb = "init";
export const BeforeSaveTdoEb = "before_save_tdo";
export const AfterLoadTdoEb = "after_load_tdo";

export type EntBehaviorMap<TExCtx> = Record<
  string,
  EntBehaviorHandler<any, any, TExCtx>
> & {
  /** 实体初始化。 */
  [InitEb]: EntBehaviorHandler<
    {
      init_params: any;
    },
    void,
    TExCtx
  >;
  /** 实体保存为 TDO 前。 */
  [BeforeSaveTdoEb]: EntBehaviorHandler<{}, void, TExCtx>;
  /** 实体从 TDO 加载后。 */
  [AfterLoadTdoEb]: EntBehaviorHandler<{}, void, TExCtx>;
};

/** 创建组件。
 * @param params 创建参数
 * @returns 新组件
 * @requires
 */
export const CreateCb = "core:create";
/** 组件转换为 TDO。
 * 若组件未实现此行为，视为返回了 `ToTDODecision.Done({})`。
 */
export const ToTdoDataCb = "core:to_tdo_data";
/** 将 TDO 转换为新组件的创建参数。
 * 若组件未实现此行为，则视为返回了输入参数的 `input`。
 */
export const FromTdoDataCb = "core:from_tdo_data";
/** 获取可以克隆当前组件的，新组件的创建参数。
 * 若组件未实现此行为，视为返回了 `undefined`。
 */
export const GetCloneParamsCb = "core:get_clone_params";

export const ToTdoDecisionReject = { type: "reject" } as const;
export const ToTdoDecision = {
  Done(params: { data?: any }) {
    const p = params as ToTDODecision & { type: "done" };
    p.type = "done";
    return p;
  },
  Reject() {
    return ToTdoDecisionReject;
  },
} as const;
export type ToTDODecision =
  | {
      type: "done";
      data: any;
    }
  | {
      type: "reject";
    };

export type CompoBehaviorMap<TExCtx> = Record<
  string,
  CompoBehaviorHandler<any, any, TExCtx>
> & {
  [CreateCb]: CompoBehaviorHandler<{ params: any }, Compo, TExCtx>;
  [ToTdoDataCb]: CompoBehaviorHandler<
    {
      save_with: (ents: string[]) => void;
    },
    ToTDODecision,
    TExCtx
  >;
  [FromTdoDataCb]: CompoBehaviorHandler<{ data: any }, any, TExCtx>;
  [GetCloneParamsCb]: CompoBehaviorHandler<{}, any, TExCtx>;
};

/** 实体上下文。 */
export class ECSCtx<
  TCompoMap extends Record<string, Compo>,
  TCompoCreateParamsMap extends Record<string, any>,
  TCompoBehaviorMap extends CompoBehaviorMap<TExCtx>,
  TEntBehaviorMap extends EntBehaviorMap<TExCtx>,
  TExCtx extends any
> {
  /** 实体ID生成器。 */
  protected id_generator = new UlidIdGenerator();

  /** 实体表。 */
  public ents = new Map<string, Ent>();

  /** 实体默认组件表。`实体类型 -> 组件类型 -> 组件`。 */
  public ent_default_compos = new Map<string, Map<string, Compo>>();

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
  /** 设置组件行为。 */
  set_compo_behavior!: (typeof this.compo_behaviors)["register_handler"];
  /** 设置多个组件行为。 */
  set_compo_behaviors!: (typeof this.compo_behaviors)["register_handlers"];
  /** 获取组件行为。 */
  get_compo_behavior!: (typeof this.compo_behaviors)["get_handler"];
  /** 执行组件行为。 */
  run_compo_behavior!: (typeof this.compo_behaviors)["exec_behavior"];
  // ---- 实体 ----
  /** 设置实体行为。 */
  set_ent_behavior!: (typeof this.ent_behaviors)["register_handler"];
  /** 设置多个实体行为。 */
  set_ent_behaviors!: (typeof this.ent_behaviors)["register_handlers"];
  /** 获取实体行为。 */
  get_ent_behavior!: (typeof this.ent_behaviors)["get_handler"];
  /** 执行实体行为。 */
  run_ent_behavior!: (typeof this.ent_behaviors)["exec_behavior"];

  // ------- 实体方法 -------
  /** 获取实体。 */
  get_ent(ent_id: string) {
    return this.ents.get(ent_id);
  }

  /** 创建实体。 */
  async create_ent(ent_type: string, params?: any) {
    type BehaviorParams = Omit<
      Parameters<TEntBehaviorMap[any]>[0],
      "it" | "ex_ctx"
    >;

    const id = this.gen_ent_id();
    const ent = new Ent(id, ent_type);
    await this.run_ent_behavior(ent, "init", {
      init_params: params,
    } as BehaviorParams);
    this.ents.set(id, ent);
    return ent;
  }

  /** 删除实体。 */
  delete_ent(ent_id: string) {
    this.ents.delete(ent_id);
    this.compos.delete_master(ent_id);
  }

  // ------- 实体TDO方法 -------
  /** 加载实体TDO。 */
  async load_ent_tdo(pack: EntTDO) {
    const [id, type, compos] = pack;
    const empty_ent = new Ent(id, type);
    this.ents.set(empty_ent.id, empty_ent); // 提前注册实体
    try {
      type BehaviorParams = Omit<
        Parameters<TCompoBehaviorMap[any]>[0],
        "it" | "ex_ctx"
      >;

      // 加载所有 CompoTDO 到 ECS 系统
      await Promise.all(
        compos.map(async (compo_tdo) => {
          const compo = await this.run_compo_behavior(empty_ent, "from_tdo", {
            input: compo_tdo[1],
          } as BehaviorParams);
          if (compo) {
            this.set_compo(empty_ent.id, compo);
          }
        })
      );

      // 后处理
      await this.run_ent_behavior(
        empty_ent,
        "after_load_tdo",
        {} as BehaviorParams
      );

      return empty_ent;
    } catch (error) {
      this.delete_ent(empty_ent.id);
      throw error;
    }
  }

  /** 保存实体TDO。 */
  async save_ent_tdo(ent: Ent, save_with: (ents: string[]) => void) {
    type BehaviorParams = Omit<
      Parameters<TCompoBehaviorMap[any]>[0],
      "it" | "ex_ctx"
    >;

    // 前处理
    await this.run_ent_behavior(ent, "before_save_tdo", {} as BehaviorParams);

    // 获取所有组件的 TDO
    const compos: CompoTDOList = [];
    const curr_compos = this.get_own_compos(ent.id);
    if (curr_compos) {
      await Promise.all(
        Array.from(curr_compos.values()).map(async (compo) => {
          const tdo_data = await this.run_compo_behavior(compo, ToTdoDataCb, {
            save_with,
          } as BehaviorParams);
          if (tdo_data) compos.push([compo.type, tdo_data]);
        })
      );
    }

    return [ent.id, ent.type, compos] satisfies EntTDO;
  }

  // ------- 组件方法 -------
  static EmptyCompos = new Map<string, Compo>();

  /** 获取组件。 */
  get_compo<TCompoType extends Extract<keyof TCompoMap, string> | string>(
    ent_id: string,
    compo_type: TCompoType
  ) {
    const ent_type = this.ents.get(ent_id)?.type;
    if (!ent_type) return;

    let compo = this.compos.get(
      ent_id,
      compo_type
    ) as TCompoType extends keyof TCompoMap ? TCompoMap[TCompoType] : unknown;

    if (!compo) {
      compo = this.ent_default_compos
        .get(ent_type)
        ?.get(compo_type) as TCompoType extends keyof TCompoMap
        ? TCompoMap[TCompoType]
        : unknown;
    }
    return compo;
  }

  /** 获取或创建组件。 */
  async get_or_create_compo<
    TCompoType extends Extract<keyof TCompoMap, string> | string
  >(entId: string, compoType: TCompoType) {
    let compo = this.get_compo(entId, compoType);
    if (!compo) {
      compo = await this.create_compo(compoType, {} as any);
      if (!compo) throw new Error(`无法创建组件 ${compoType}。`);
      this.set_compo(entId, compo);
    }
    return compo;
  }

  get_own_compos(ent_id: string) {
    return this.compos.get_master(ent_id) ?? ECSCtx.EmptyCompos;
  }

  /** 获取组件。 */
  get_compos(ent_id: string) {
    const ent_type = this.ents.get(ent_id)?.type;
    if (!ent_type) return ECSCtx.EmptyCompos;

    const result = new Map<string, Compo>();
    this.compos.get_master(ent_id)?.forEach((compo) => {
      result.set(compo.type, compo);
    });
    this.ent_default_compos.get(ent_type)?.forEach((compo) => {
      result.set(compo.type, compo);
    });
    return result;
  }

  /** 设置组件。 */
  set_compo(ent_id: string, compo: Compo) {
    this.compos.set(ent_id, compo.type, compo);
  }

  /** 设置多个组件。 */
  set_compos(ent_id: string, compos: Compo[]) {
    compos.forEach((compo) => {
      this.compos.set(ent_id, compo.type, compo);
    });
  }

  /** 设置实体默认组件。实体默认组件的内容不会被记录到 TDO 中。 */
  set_ent_default_compo(ent_type: string, compo: Compo) {
    let compo_map = this.ent_default_compos.get(ent_type);
    if (!compo_map) {
      compo_map = new Map();
      this.ent_default_compos.set(ent_type, compo_map);
    }
    compo_map.set(compo.type, compo);
  }

  async create_compo<
    TCompoType extends Extract<keyof TCompoMap, string> | string
  >(compo_type: TCompoType, params: TCompoCreateParamsMap[TCompoType]) {
    return await this.run_compo_behavior(
      { type: compo_type } as any,
      CreateCb as any,
      {
        params,
      } as any
    );
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

    // 绑定行为方法
    this.set_ent_behavior = this.ent_behaviors.register_handler.bind(
      this.ent_behaviors
    );
    this.set_ent_behaviors = this.ent_behaviors.register_handlers.bind(
      this.ent_behaviors
    );
    this.get_ent_behavior = this.ent_behaviors.get_handler.bind(
      this.ent_behaviors
    );
    this.run_ent_behavior = this.ent_behaviors.exec_behavior.bind(
      this.ent_behaviors
    );

    this.set_compo_behavior = this.compo_behaviors.register_handler.bind(
      this.compo_behaviors
    );
    this.set_compo_behaviors = this.compo_behaviors.register_handlers.bind(
      this.compo_behaviors
    );
    this.get_compo_behavior = this.compo_behaviors.get_handler.bind(
      this.compo_behaviors
    );
    this.run_compo_behavior = this.compo_behaviors.exec_behavior.bind(
      this.compo_behaviors
    );
  }
}
