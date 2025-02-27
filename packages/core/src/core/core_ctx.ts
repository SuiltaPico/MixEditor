import { MaybePromise } from "@mixeditor/common";
import { SelectionCtx } from "../selection/selection";
import { EntMap, IEntCtx } from "../ent/ent_ctx";
import { EntBehaviorMap } from "../ent/ent_behavior";
import { ContentCtx } from "../content/content_ctx";
import { TDOSerializeCtx } from "../tdo/serialize/serialize_ctx";
import { RootEnt } from "./root_ent";

export type SelectionMap = Record<string, any>;

export interface InitParams {
  root_ent?: RootEnt;
}

export interface ICoreCtx {
  ent: IEntCtx<any, any, ThisType<this>>;
  content: ContentCtx<this["ent"]>;

  op: OpManager;
  history: HistoryManager;

  pipe_bus: PipeManager;

  selection: SelectionCtx<any>;

  tdo_serialize: TDOSerializeCtx<any, any, ThisType<this>>;

  plugin: PluginManager;

  init(params: InitParams): MaybePromise<void>;
  destroy(): MaybePromise<void>;
}
