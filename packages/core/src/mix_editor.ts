import { SelectionCtx } from "./selection/selection";

export interface SelectionMap {}

export interface InitParams {
  root_ent?: RootEntity;
}

export class MixEditor {
  ent: EntManager;
  content: ContentManager;

  op: OpManager;
  history: HistoryManager;

  pipe_bus: PipeManager;

  selection: SelectionCtx<SelectionMap> = new SelectionCtx();

  tdo_serialize: TDOSerializeManager;

  plugin: PluginManager;

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

  constructor() {}
}
