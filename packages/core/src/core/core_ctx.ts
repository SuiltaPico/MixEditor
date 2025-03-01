import { MaybePromise } from "@mixeditor/common";
import { ContentCtx } from "../content/content_ctx";
import { IEntCtx } from "../ent/ent_ctx";
import { IEntTDOCtx } from "../ent/tdo/tdo_ctx";
import { IOpCtx } from "../op";
import { PipeCtx } from "../pipe/pipe_ctx";
import { PluginCtx } from "../plugin";
import { SelectionCtx } from "../selection/selection";
import { TDOSerializeCtx } from "../tdo/serialize/serialize_ctx";
import { RootEntTDO } from "./ent/root_ent";

export interface InitParams {
  root_ent_tdo?: RootEntTDO;
}

export interface ICoreCtx {
  ent: IEntCtx<any, any, ThisType<this>>;
  ent_tdo: IEntTDOCtx<any, any, ThisType<this>>;
  content: ContentCtx<this["ent"]>;

  op: IOpCtx<any, any, ThisType<this>>;
  // history: IHistoryCtx;

  pipe: PipeCtx<any, this>;

  selection: SelectionCtx<any>;

  tdo_serialize: TDOSerializeCtx<any, any, ThisType<this>>;

  plugin: PluginCtx<ThisType<this>>;

  init(params: InitParams): MaybePromise<void>;
  destroy(): MaybePromise<void>;
}
