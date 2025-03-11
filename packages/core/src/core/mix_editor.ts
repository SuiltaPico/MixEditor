import { ContentCtx } from "../content/content_ctx";
import {
  Compo,
  CompoBehaviorHandler,
  CompoBehaviorMap,
  ECSCtx,
  EntBehaviorHandler,
  EntBehaviorMap
} from "../ecs";
import { OpBehaviorHandler, OpBehaviorMap, OpCtx, OpMap } from "../op";
import { IPipeEvent, IPipeStageHandler, PipeCtx } from "../pipe";
import { Plugin, PluginCtx } from "../plugin";
import { SelectionCtx, SelectionMap } from "../selection/selection";
import {
  TDODeserializerMap,
  TDOSerializeCtx,
  TDOSerializerMap,
} from "../tdo/serialize/serialize_ctx";
// import { ICoreCtx, InitParams } from "./core_ctx";
import { RootEntTDO } from "./ent/root_ent";
import { MECorePipeEventMap } from "./pipe";
import { regist_core_behaviors } from "./regist_core_behaviors";
import { TreeSelectionMapExtend } from "./selection";

export type MEEntBehaviorHandler<
  TParams extends object,
  TResult
> = EntBehaviorHandler<TParams, TResult, MixEditor>;
export type MECompoBehaviorHandler<
  TParams extends object,
  TResult
> = CompoBehaviorHandler<TParams, TResult, MixEditor>;
export type MEOpBehaviorHandler<
  TParams extends object,
  TResult
> = OpBehaviorHandler<TParams, TResult, MixEditor>;

export type MEEvent = IPipeEvent<MixEditor>;
export type MEPipeStageHandler<TEvent extends MEEvent> = IPipeStageHandler<
  TEvent,
  MixEditor
>;

/** MixEditor 的组件表，供插件扩展 */
export interface MECompoMap extends Record<string, Compo> {}
/** MixEditor 的实体行为映射表，供插件扩展 */
export interface MEEntBehaviorMap extends EntBehaviorMap<MixEditor> {}
/** MixEditor 的组件行为映射表，供插件扩展 */
export interface MECompoBehaviorMap extends CompoBehaviorMap<MixEditor> {}

/** MixEditor 的操作表，供插件扩展 */
export interface MEOpMap extends OpMap {}
/** MixEditor 的操作行为映射表，供插件扩展 */
export interface MEOpBehaviorMap extends OpBehaviorMap<any> {}

/** MixEditor 的选区表，供插件扩展 */
export interface MESelectionMap extends SelectionMap, TreeSelectionMapExtend {}
export type MESelection = MESelectionMap[keyof MESelectionMap];

/** MixEditor 的TDO序列化表，供插件扩展 */
export interface METDOSerializeMap extends TDOSerializerMap<any> {}
/** MixEditor 的TDO反序列化表，供插件扩展 */
export interface METDODeSerializeMap extends TDODeserializerMap<any> {}

/** MixEditor 的管道事件表，供插件扩展 */
export interface MEPipeEventMap extends MECorePipeEventMap {}

export type MEPlugin = Plugin<MixEditor>;

export interface InitParams {
  root_ent_tdo?: RootEntTDO;
}

/** MixEditor 的上下文。 */
export class MixEditor {
  ecs: ECSCtx<MECompoMap, MECompoBehaviorMap, MEEntBehaviorMap, this>;

  content: ContentCtx<this["ecs"]>;

  op: OpCtx<MEOpMap, MEOpBehaviorMap, this>;

  pipe: PipeCtx<MEPipeEventMap, this>;

  selection: SelectionCtx<MESelectionMap>;

  tdo_serialize: TDOSerializeCtx<
    METDOSerializeMap,
    METDODeSerializeMap,
    ThisType<this>
  >;

  plugin: PluginCtx<ThisType<this>>;

  async init(params: InitParams) {
    regist_core_behaviors(this);

    await this.pipe.execute({ pipe_id: "init" }); // 初始化插件

    if (params.root_ent_tdo) {
      await this.pipe.execute({
        pipe_id: "load",
        input: params.root_ent_tdo,
      });
    }
  }

  async destroy() {
    await this.pipe.execute({ pipe_id: "destroy" }); // 销毁插件
  }

  constructor() {
    this.ecs = new ECSCtx(this);
    this.content = new ContentCtx(this.ecs);
    this.op = new OpCtx(this);
    this.pipe = new PipeCtx<MEPipeEventMap, this>(this);
    this.selection = new SelectionCtx();
    this.tdo_serialize = new TDOSerializeCtx<
      METDOSerializeMap,
      METDODeSerializeMap,
      ThisType<this>
    >(this);
    this.plugin = new PluginCtx(this);
  }
}
