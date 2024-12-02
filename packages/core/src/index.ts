import { Plugin, PluginManager } from "@mauchise/plugin-manager";
import { HistoryManager } from "./operation/HistoryManager";

class MixEditor {
  plugin_manager = new PluginManager();
  command_manager = new HistoryManager();
  selection: any;

  constructor(config: { plugins: Plugin[] }) {
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });
  }
}

export default MixEditor;
