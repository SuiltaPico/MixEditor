import { PluginManager } from "@mauchise/plugin-manager";
import {
  Document,
  DocumentTransferDataObject,
  save_document,
} from "./document";
import { EventHandler, EventManager } from "./event";
import { NodeManager } from "./node/NodeManager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { Saver } from "./saver";
import { Selection } from "./selection";
import { createSignal } from "@mixeditor/common";

declare module "./MixEditor" {
  export interface Events {
    init: {
      event_type: "init";
    };
  }
}

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager();
  /** 命令管理器。 */
  command_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager = new NodeManager(this);
  /** 文档。 */
  document = new Document();

  /** 事件管理器。 */
  event_manager = new EventManager<Events[keyof Events]>();
  /** 插件管理器。 */
  plugin_manager = new PluginManager<MixEditorPluginContext>();
  /** 文档选区管理。 */
  selection = new Selection(this);
  /** 文档保存器。 */
  saver = new Saver(this);

  /** 事件处理器。 */
  handlers = {
    save: async ({ event, wait_dependencies }: Parameters<EventHandler>[0]) => {
      await wait_dependencies();
      const tdo = await this.node_manager.save(this.document);
      event.context.save_result = tdo;
    },
  };

  async init() {
    await this.plugin_manager.init_plugins({ editor: this });
    this.event_manager.emit({ event_type: "init" });
  }

  constructor(config: { plugins: MixEditorPlugin[] }) {
    // 注册插件
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });

    // 注册文档节点保存行为
    this.node_manager.register_behavior("document", "save", save_document);

    // 注册文档节点加载行为
    this.saver.register_loader("document", async (tdo) => {
      const dtdo = tdo as DocumentTransferDataObject;
      const document = new Document(
        createSignal(
          await Promise.all(
            dtdo.data.children.map((child) => this.saver.load_node(child))
          )
        ),
        dtdo.data.schema_version,
        dtdo.data.created_at,
        dtdo.data.modified_at
      );
      return document;
    });

    // 注册保存流程
    this.event_manager.add_handler("save", this.handlers.save);
  }
}
