import { createRoot } from "solid-js";
import { ContentCtx } from "../content/content_ctx";
import {
  CompoBehaviorHandler,
  CompoBehaviorMap,
  ECSCompoMetaMap,
  ECSCtx,
  ECSEntMetaMap,
  ECSPipeEventMap,
} from "../ecs";
import { OpBehaviorHandler, OpBehaviorMap, OpCtx } from "../op";
import { IPipeEvent, IPipeStageHandler, PipeCtx } from "../pipe";
import { Plugin, PluginCtx } from "../plugin";
import { SelectionCtx, SelectionMap } from "../selection/selection";
import {
  DTODeserializerMap,
  DTOSerializeCtx,
  DTOSerializerMap,
} from "../serialize/serialize_ctx";
import { ChildCompoBehaviorMap, CoreCompoMetaMap } from "./compo";
import { CoreEntInitPipeEventMap } from "./ent";
import { MECoreOpMap } from "./op";
import { MECorePipeEventMap } from "./pipe";
import { regist_core_items } from "./regist_core_items";
import { TreeSelectionMapExtend } from "./selection";

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

/** MixEditor 的实体元数据表，供插件扩展 */
export interface MEEntMetaMap extends ECSEntMetaMap {}

/** MixEditor 的组件元数据表，供插件扩展 */
export interface MECompoMetaMap extends CoreCompoMetaMap, ECSCompoMetaMap {}

/** MixEditor 的组件行为映射表，供插件扩展 */
export interface MECompoBehaviorMap
  extends CompoBehaviorMap<MixEditor>,
    ChildCompoBehaviorMap {}

export interface MEOpMap extends MECompoMetaMap {}
/** MixEditor 的操作行为映射表，供插件扩展 */
export interface MEOpBehaviorMap extends OpBehaviorMap<MixEditor> {}

/** MixEditor 的选区表，供插件扩展 */
export interface MESelectionMap extends SelectionMap, TreeSelectionMapExtend {}
export type MESelection = MESelectionMap[keyof MESelectionMap] | undefined;

/** MixEditor 的DTO序列化表，供插件扩展 */
export interface MEDTOSerializeMap extends DTOSerializerMap<any> {}
/** MixEditor 的DTO反序列化表，供插件扩展 */
export interface MEDTODeSerializeMap extends DTODeserializerMap<any> {}

/** MixEditor 的管道事件表，供插件扩展 */
export interface MEPipeEventMap
  extends MECorePipeEventMap,
    ECSPipeEventMap,
    CoreEntInitPipeEventMap {}

export type MEPlugin = Plugin<MixEditor>;

export interface InitParams {
  root_ent?: string;
}

/** MixEditor 的上下文。 */
export class MixEditor {
  ecs: ECSCtx<MEEntMetaMap, MECompoMetaMap, MECompoBehaviorMap>;

  content: ContentCtx;

  op: OpCtx<MECoreOpMap, MEOpBehaviorMap, this>;

  pipe: PipeCtx<MEPipeEventMap, this>;

  selection: SelectionCtx<MESelectionMap>;

  serialize: DTOSerializeCtx<
    MEDTOSerializeMap,
    MEDTODeSerializeMap,
    ThisType<this>
  >;

  plugin: PluginCtx<this>;

  destroy_reactive!: () => void;

  async init(params: InitParams) {
    await createRoot(async (dispose) => {
      regist_core_items(this);

      await this.pipe.execute({ pipe_id: "init" }); // 初始化插件

      if (params.root_ent) {
        this.content.root.set(params.root_ent);
      }

      this.destroy_reactive = dispose;
    });
  }

  async destroy() {
    await this.pipe.execute({ pipe_id: "destroy" }); // 销毁插件
    this.destroy_reactive();
  }

  constructor(params: { plugins: MEPlugin[] }) {
    this.ecs = new ECSCtx(this);
    this.content = new ContentCtx();
    this.op = new OpCtx(this);
    this.pipe = new PipeCtx<MEPipeEventMap, this>(this);
    this.selection = new SelectionCtx();
    this.serialize = new DTOSerializeCtx<
      MEDTOSerializeMap,
      MEDTODeSerializeMap,
      ThisType<this>
    >(this);
    this.plugin = new PluginCtx(this);
    for (const plugin of params.plugins) {
      this.plugin.register(plugin);
    }
  }
}
