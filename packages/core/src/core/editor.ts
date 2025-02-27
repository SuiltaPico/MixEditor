import { ContentCtx } from "../content/content_ctx";
import { EntBehaviorMap } from "../ent/ent_behavior";
import { EntCtx, EntMap } from "../ent/ent_ctx";
import { OpBehaviorMap, OpCtx, OpMap } from "../op";
import { SelectionCtx } from "../selection/selection";
import { ICore, InitParams, SelectionMap } from "./interface";

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

export class MixEditor
  implements ICore<MEEntMap, MEEntBehaviorMap, MESelectionMap>
{
  ent: EntCtx<MEEntMap, MEEntBehaviorMap, ThisType<this>>;
  content: ContentCtx<this["ent"]>;

  op: OpCtx<MEOpMap, MEOpBehaviorMap, ThisType<this>>;
  history: HistoryCtx;

  pipe_bus: PipeCtx;

  selection = new SelectionCtx<MESelectionMap>();

  tdo_serialize: TDOSerializeCtx;

  plugin: PluginCtx;

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
  }
}
