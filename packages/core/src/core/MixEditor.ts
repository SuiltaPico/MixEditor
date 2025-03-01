import { ContentCtx } from "../content/content_ctx";
import { Ent } from "../ent";
import { EntBehaviorHandler, EntBehaviorMap } from "../ent/ent_behavior";
import { DomainCtxMap, EntCtx, EntMap } from "../ent/ent_ctx";
import { EntTDO } from "../ent/tdo/tdo";
import {
  EntTDOBehaviorHandler,
  EntTDOBehaviorMap,
} from "../ent/tdo/tdo_behavior";
import { EntTDOCtx, EntTDOMap } from "../ent/tdo/tdo_ctx";
import { OpBehaviorHandler, OpBehaviorMap, OpCtx, OpMap } from "../op";
import { IPipeEvent, IPipeStageHandler, PipeCtx, PipeEventMap } from "../pipe";
import { PluginCtx } from "../plugin";
import { SelectionCtx, SelectionMap } from "../selection/selection";
import {
  TDODeserializerMap,
  TDOSerializeCtx,
  TDOSerializerMap,
} from "../tdo/serialize/serialize_ctx";
import { ICoreCtx, InitParams } from "./core_ctx";
import { RootEnt, RootEntTDO } from "./ent/root_ent";
import {
  DestroyEvent,
  InitEvent,
  LoadSerializedToContentEvent,
  LoadTdoToContentEvent,
  regist_core_behaviors,
  SaveContentToSerializedEvent,
  SaveContentToTdoEvent,
} from "./regist_core_behaviors";

export type MEEntBehaviorHandler<
  TParams extends object,
  TResult
> = EntBehaviorHandler<TParams, TResult, MixEditor>;
export type MEEntTDOBehaviorHandler<
  TParams extends object,
  TResult
> = EntTDOBehaviorHandler<TParams, TResult, MixEditor>;
export type MEOpBehaviorHandler<
  TParams extends object,
  TResult
> = OpBehaviorHandler<TParams, TResult, MixEditor>;

export type MEEvent = IPipeEvent<MixEditor>;
export type MEPipeStageHandler<TEvent extends MEEvent> = IPipeStageHandler<
  TEvent,
  MixEditor
>;

/** MixEditor 的实体行为映射表，供插件扩展 */
export interface MEEntBehaviorMap extends EntBehaviorMap<any> {
  to_tdo: MEEntBehaviorHandler<{}, EntTDO>;
}
/** MixEditor 的实体表，供插件扩展 */
export interface MEEntMap extends EntMap {
  root: RootEnt;
}
/** MixEditor 的领域上下文表，供插件扩展 */
export interface MEEntDomainCtxMap extends DomainCtxMap {}

/** MixEditor 的实体TDO表，供插件扩展 */
export interface MEEntTDOMap extends EntTDOMap {
  root: RootEntTDO;
}
/** MixEditor 的实体TDO行为映射表，供插件扩展 */
export interface MEEntTDOBehaviorMap extends EntTDOBehaviorMap<any> {
  to_ent: MEEntTDOBehaviorHandler<{}, Ent>;
}

/** MixEditor 的操作表，供插件扩展 */
export interface MEOpMap extends OpMap {}
/** MixEditor 的操作行为映射表，供插件扩展 */
export interface MEOpBehaviorMap extends OpBehaviorMap<any> {
  to_ent: MEOpBehaviorHandler<{}, Ent>;
}

/** MixEditor 的选区表，供插件扩展 */
export interface MESelectionMap extends SelectionMap {}

/** MixEditor 的TDO序列化表，供插件扩展 */
export interface METDOSerializeMap extends TDOSerializerMap<any> {}
/** MixEditor 的TDO反序列化表，供插件扩展 */
export interface METDODeSerializeMap extends TDODeserializerMap<any> {}

/** MixEditor 的管道事件表，供插件扩展 */
export interface MEPipeEventMap extends PipeEventMap<any> {
  init: InitEvent;
  destroy: DestroyEvent;
  load_tdo_to_content: LoadTdoToContentEvent;
  save_content_to_tdo: SaveContentToTdoEvent;
  load_serialized_to_content: LoadSerializedToContentEvent;
  save_content_to_serialized: SaveContentToSerializedEvent;
}

/** MixEditor 的上下文。 */
export class MixEditor implements ICoreCtx {
  ent: EntCtx<MEEntMap, MEEntBehaviorMap, MEEntDomainCtxMap, this>;
  ent_tdo: EntTDOCtx<MEEntTDOMap, MEEntTDOBehaviorMap, this>;
  content: ContentCtx<this["ent"]>;

  op: OpCtx<MEOpMap, MEOpBehaviorMap, this>;
  // history: HistoryCtx;

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
        pipe_id: "load_tdo_to_content",
        input: params.root_ent_tdo,
      });
    }
  }

  async destroy() {
    await this.pipe.execute({ pipe_id: "destroy" }); // 销毁插件
  }

  constructor() {
    this.ent = new EntCtx(this);
    this.ent_tdo = new EntTDOCtx(this);
    this.content = new ContentCtx(this.ent);
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
