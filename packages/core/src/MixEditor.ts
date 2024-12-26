import { Plugin, PluginManager } from "@mauchise/plugin-manager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { Selection } from "./selection";
import { NodeManager } from "./node/NodeManager";
import { Document } from "./document";
import { EventManager } from "./event";

export class MixEditor {
  operation_manager = new OperationManager();
  command_manager = new HistoryManager(this.operation_manager);

  node_manager = new NodeManager();
  document = new Document();
  selection = new Selection(this);

  event_manager = new EventManager();
  plugin_manager = new PluginManager();

  async init() {
    await this.plugin_manager.init_plugins({});
    this.event_manager.emit({ event_type: ".core:init" });
  }

  constructor(config: { plugins: Plugin[] }) {
    // 注册插件
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });
  }
}
