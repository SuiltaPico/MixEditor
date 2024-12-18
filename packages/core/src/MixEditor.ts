import { Plugin, PluginManager } from "@mauchise/plugin-manager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { Selection } from "./selection";
import { AsyncTask } from "./common/promise";

export class MixEditor {
  plugin_manager = new PluginManager();
  operation_manager = new OperationManager();
  command_manager = new HistoryManager(this.operation_manager);
  selection = new Selection(this);

  init_task = new AsyncTask(async () => {
    await this._init();
  });

  async init() {
    await this.init_task.execute();
  }

  private _init() {
    return this.plugin_manager.init_plugins(this);
  }

  constructor(config: { plugins: Plugin[] }) {
    // 注册插件
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });
  }
}
