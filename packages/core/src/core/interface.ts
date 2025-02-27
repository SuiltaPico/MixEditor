import { MaybePromise } from "@mixeditor/common";
import { SelectionCtx } from "../selection/selection";
import { IEntCtx } from "../ent/ent_ctx";
import { EntBehaviorMap } from "../ent/ent_behavior";

export type SelectionMap = Record<string, any>;

export interface InitParams {
  root_ent?: RootEntity;
}

export interface ICore<
  TBehaviorMap extends EntBehaviorMap<any>,
  TSelectionMap extends SelectionMap
> {
  ent: IEntCtx<TBehaviorMap, ThisType<this>>;
  content: ContentManager;

  op: OpManager;
  history: HistoryManager;

  pipe_bus: PipeManager;

  selection: SelectionCtx<TSelectionMap>;

  tdo_serialize: TDOSerializeManager;

  plugin: PluginManager;
  
  init(params: InitParams): MaybePromise<void>;
  destroy(): MaybePromise<void>;
}
