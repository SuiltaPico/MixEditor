import { MaybePromise } from "@mixeditor/common";
import { SelectionCtx } from "../selection/selection";
import { EntMap, IEntCtx } from "../ent/ent_ctx";
import { EntBehaviorMap } from "../ent/ent_behavior";
import { ContentCtx } from "../content/content_ctx";

export type SelectionMap = Record<string, any>;

export interface InitParams {
  root_ent?: RootEntity;
}

export interface ICore<
  TEnt extends EntMap,
  TBehaviorMap extends EntBehaviorMap<any>,
  TSelectionMap extends SelectionMap
> {
  ent: IEntCtx<TEnt, TBehaviorMap, ThisType<this>>;
  content: ContentCtx<this["ent"]>;

  op: OpManager;
  history: HistoryManager;

  pipe_bus: PipeManager;

  selection: SelectionCtx<TSelectionMap>;

  tdo_serialize: TDOSerializeManager;

  plugin: PluginManager;

  init(params: InitParams): MaybePromise<void>;
  destroy(): MaybePromise<void>;
}
