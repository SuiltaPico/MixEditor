import { Plugin, PluginManager } from "@mauchise/plugin-manager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { Selection } from "./selection";

export class MixEditor {
  plugin_manager = new PluginManager();
  operation_manager = new OperationManager();
  command_manager = new HistoryManager(this.operation_manager);
  selection = new Selection(this);

  constructor(config: { plugins: Plugin[] }) {
    // 注册插件
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });
  }
}