import { UlidIdGenerator } from "@mixeditor/common";
import { BehaviorHandler, BehaviorHandlerManager } from "../common/behavior";
import { TwoLevelTypeMap } from "../common/data_struct/two_level_type_map";
import { Compo, CompoDTOList } from "./compo";
import { EntDTO } from "./ent";
import { MixEditor } from "../core";
import { IPipeEvent, PipeEventMap } from "../pipe";

export type ECSCompoMap = Record<string, { compo: Compo; create_params: any }>;

export const ECSCreateEntPipeId = "core:create_ent";
export const ECSLoadEntDtoPipeId = "core:load_ent_dto";
export const ECSAfterLoadEntPipeId = "core:after_load_ent";

export interface ECSCreateEntEvent extends IPipeEvent<MixEditor> {
  ent_type: string;
  params: any;
  ent_id: string;
}

export interface ECSAfterLoadEntEvent extends IPipeEvent<MixEditor> {
  ent_id: string;
}

export interface ECSEntInitEvent extends IPipeEvent<MixEditor> {
  ent_id: string;
  params: any;
}

export interface ECSPipeEventMap extends PipeEventMap<MixEditor> {
  [ECSCreateEntPipeId]: ECSCreateEntEvent;
  [ECSAfterLoadEntPipeId]: ECSAfterLoadEntEvent;
  // [`${string}.init`]: EntInitPipeEvent;
}

export type CompoBehaviorHandler<
  TParams extends object,
  TResult,
  TExCtx
> = BehaviorHandler<Compo, TParams, TResult, TExCtx>;

/** 创建组件。
 * @param params 创建参数
 * @returns 新组件
 * @requires
 */
export const CreateCb = "core:create";
/** 组件转换为 DTO。
 * 若组件未实现此行为，视为返回了 `ToDTODecision.Done({})`。
 */
export const ToDtoDataCb = "core:to_dto_data";
/** 将 DTO 转换为新组件的创建参数。
 * 若组件未实现此行为，则视为返回了输入参数的 `input`。
 */
export const FromDtoDataCb = "core:from_dto_data";
/** 获取可以克隆当前组件的，新组件的创建参数。
 * 若组件未实现此行为，视为返回了 `undefined`。
 */
export const GetCloneParamsCb = "core:get_clone_params";

export const ToDtoDecisionReject = { type: "reject" } as const;
export const ToDtoDecision = {
  Done(params: { data?: any }) {
    const p = params as ToDTODecision & { type: "done" };
    p.type = "done";
    return p;
  },
  Reject() {
    return ToDtoDecisionReject;
  },
} as const;
export type ToDTODecision =
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
  [ToDtoDataCb]: CompoBehaviorHandler<
    {
      save_with: (ents: string[]) => void;
    },
    ToDTODecision,
    TExCtx
  >;
  [FromDtoDataCb]: CompoBehaviorHandler<{ data: any }, any, TExCtx>;
  [GetCloneParamsCb]: CompoBehaviorHandler<{}, any, TExCtx>;
};

/** 实体上下文。 */
export class ECSCtx<
  TCompoMap extends ECSCompoMap,
  TCompoBehaviorMap extends CompoBehaviorMap<MixEditor>
> {
  /** 实体ID生成器。 */
  protected id_generator = new UlidIdGenerator();

  /** 实体表。 */
  public ents = new Set<string>();

  /** 实体组件表。`实体ID -> 组件类型 -> 组件`。 */
  // 不使用 `组件类型 -> 实体ID -> 组件` 是因为增减实体ID时
  // 可能会导致 JS 引擎重建所有 `实体ID -> 组件` 的索引
  protected compos = new TwoLevelTypeMap<string, string, Compo>();

  /** 组件行为表。记录组件的行为。 */
  protected compo_behaviors: BehaviorHandlerManager<
    TCompoBehaviorMap,
    Compo,
    { [key in keyof TCompoMap]: TCompoMap[key]["compo"] },
    MixEditor
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

  // ------- 实体方法 -------
  /** 创建实体。 */
  async create_ent(ent_type: string, params?: any) {
    const id = this.gen_ent_id();
    await this.ex_ctx.pipe.execute({
      pipe_id: ent_type + ".init",
      params,
      ent_id: id,
      ex_ctx: this.ex_ctx,
    } satisfies ECSEntInitEvent as any);
    return id;
  }

  /** 删除实体。 */
  delete_ent(ent_id: string) {
    this.ents.delete(ent_id);
    this.compos.delete_master(ent_id);
  }

  // ------- 实体DTO方法 -------
  /** 加载实体DTO。 */
  async load_ent_dto(pack: EntDTO) {
    const [id, compos] = pack;
    this.ents.add(id);
    try {
      type BehaviorParams = Omit<
        Parameters<TCompoBehaviorMap[any]>[0],
        "it" | "ex_ctx"
      >;

      // 加载所有 CompoDTO 到 ECS 系统
      await Promise.all(
        compos.map(async (compo_dto) => {
          const [compo_type, data] = compo_dto;
          const compo = await this.run_compo_behavior(
            { type: compo_type } as any,
            FromDtoDataCb,
            {
              data: data,
            } as BehaviorParams
          );
          if (compo) {
            this.set_compo(id, compo);
          }
        })
      );

      await this.ex_ctx.pipe.execute({
        pipe_id: ECSAfterLoadEntPipeId,
        ent_id: id,
        ex_ctx: this.ex_ctx,
      });

      return id;
    } catch (error) {
      this.delete_ent(id);
      throw error;
    }
  }

  /** 保存实体DTO。 */
  async save_ent_dto(ent: string, save_with: (ents: string[]) => void) {
    type BehaviorParams = Omit<
      Parameters<TCompoBehaviorMap[any]>[0],
      "it" | "ex_ctx"
    >;

    // 获取所有组件的 DTO
    const compos: CompoDTOList = [];
    const curr_compos = this.get_own_compos(ent);
    if (curr_compos) {
      await Promise.all(
        Array.from(curr_compos.values()).map(async (compo) => {
          const dto_decision = await this.run_compo_behavior(
            compo,
            ToDtoDataCb,
            {
              save_with,
            } as BehaviorParams
          );
          if (dto_decision && dto_decision.type === "done") {
            compos.push([compo.type, dto_decision.data]);
          }
        })
      );
    }

    return [ent, compos] satisfies EntDTO;
  }

  // ------- 组件方法 -------
  static EmptyCompos = new Map<string, Compo>();

  /** 获取组件。 */
  get_compo<TCompoType extends Extract<keyof TCompoMap, string> | string>(
    ent_id: string,
    compo_type: TCompoType
  ) {
    let compo = this.compos.get(
      ent_id,
      compo_type
    ) as TCompoType extends keyof TCompoMap
      ? TCompoMap[TCompoType]["compo"]
      : undefined;
    return compo;
  }

  /** 获取或创建组件。 */
  async get_or_create_compo<
    TCompoType extends Extract<keyof TCompoMap, string> | string
  >(entId: string, compoType: TCompoType) {
    let compo = this.get_compo(entId, compoType);
    if (!compo) {
      compo = (await this.create_compo(compoType, {} as any)) as any;
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
    const result = new Map<string, Compo>();
    this.compos.get_master(ent_id)?.forEach((compo) => {
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

  /** 创建组件。 */
  async create_compo<
    TCompoType extends Extract<keyof TCompoMap, string> | string
  >(compo_type: TCompoType, params: TCompoMap[TCompoType]["create_params"]) {
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

  constructor(public ex_ctx: MixEditor) {
    this.compo_behaviors = new BehaviorHandlerManager<
      TCompoBehaviorMap,
      Compo,
      { [key in keyof TCompoMap]: TCompoMap[key]["compo"] },
      MixEditor
    >(this.ex_ctx);

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
