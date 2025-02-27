import { ContentCtx } from "../content/content_ctx";
import { EntBehaviorMap } from "../ent/ent_behavior";
import { EntCtx, EntMap } from "../ent/ent_ctx";
import { OpBehaviorMap, OpCtx, OpMap } from "../op";
import { PluginCtx } from "../plugin";
import { SelectionCtx } from "../selection/selection";
import {
  TDODeserializerMap,
  TDOSerializeCtx,
  TDOSerializerMap,
} from "../tdo/serialize/serialize_ctx";
import { ICoreCtx, InitParams, SelectionMap } from "./core_ctx";

/** MixEditor 的实体行为映射表，供插件扩展 */
export interface MEEntBehaviorMap extends EntBehaviorMap<any> {}
/** MixEditor 的实体表，供插件扩展 */
export interface MEEntMap extends EntMap {}

/** MixEditor 的操作表，供插件扩展 */
export interface MEOpMap extends OpMap {}
/** MixEditor 的操作行为映射表，供插件扩展 */
export interface MEOpBehaviorMap extends OpBehaviorMap<any> {}

/** MixEditor 的选区表，供插件扩展 */
export interface MESelectionMap extends SelectionMap {}

/** MixEditor 的TDO序列化表，供插件扩展 */
export interface METDOSerializeMap extends TDOSerializerMap<any> {}

/** MixEditor 的TDO反序列化表，供插件扩展 */
export interface METDODeSerializeMap extends TDODeserializerMap<any> {}

export class MixEditor implements ICoreCtx {
  ent: EntCtx<MEEntMap, MEEntBehaviorMap, ThisType<this>>;
  content: ContentCtx<this["ent"]>;

  op: OpCtx<MEOpMap, MEOpBehaviorMap, ThisType<this>>;
  history: HistoryCtx;

  pipe_bus: PipeCtx;

  selection: SelectionCtx<MESelectionMap>;

  tdo_serialize: TDOSerializeCtx<
    METDOSerializeMap,
    METDODeSerializeMap,
    ThisType<this>
  >;

  plugin: PluginCtx<ThisType<this>>;

  async init(params: InitParams) {
    regist_core_behaviors(this);

    await this.pipe_bus.execute({ type: "init" }); // 初始化插件

    if (params.root_ent) {
      await this.pipe_bus.execute({
        type: "load_tdo_to_content",
        input: params.root_ent,
      });
    }
  }

  async destroy() {
    await this.pipe_bus.execute({ type: "destroy" }); // 销毁插件
  }

  constructor() {
    this.ent = new EntCtx(this);
    this.content = new ContentCtx(this.ent);
    this.op = new OpCtx(this);
    this.selection = new SelectionCtx();
    this.tdo_serialize = new TDOSerializeCtx<
      METDOSerializeMap,
      METDODeSerializeMap,
      ThisType<this>
    >(this);
    this.plugin = new PluginCtx(this);
  }
}
