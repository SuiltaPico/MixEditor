import { PluginManager } from "@mauchise/plugin-manager";
import { createSignal } from "@mixeditor/common";
import { EventHandler, EventManager } from "./event";
import { DocumentNode, DocumentTDO, save_document } from "./node/document";
import { AllNodeTypes } from "./node/Node";
import { NodeBehavior, NodeManager } from "./node/NodeManager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { Saver } from "./saver";
import { Selection } from "./selection";

export interface Events {
  init: {
    event_type: "init";
  };
  before_save: {
    event_type: "before_save";
  };
  save: {
    event_type: "save";
  };
  after_save: {
    event_type: "after_save";
    save_result: any;
  };
  before_load: {
    event_type: "before_load";
    tdo: DocumentTDO;
  };
  load: {
    event_type: "load";
    tdo: DocumentTDO;
  };
  after_load: {
    event_type: "after_load";
  };
}

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager();
  /** 命令管理器。 */
  command_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager: NodeManager<NodeBehavior<AllNodeTypes>> = new NodeManager<
    NodeBehavior<AllNodeTypes>
  >(this);
  /** 文档。 */
  document = createSignal(new DocumentNode());

  /** 事件管理器。 */
  event_manager: EventManager<Events[keyof Events]> = new EventManager<
    Events[keyof Events]
  >();
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
      const tdo = await this.node_manager.execute_behavior(
        "save",
        this.document.get()
      );
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
      const dtdo = tdo as DocumentTDO;
      const document = new DocumentNode(
        createSignal(
          await Promise.all(
            dtdo.children.map((child) => this.saver.load_node_from_tdo(child))
          )
        ),
        dtdo.schema_version,
        dtdo.created_at,
        dtdo.modified_at
      );
      return document;
    });

    // 注册加载流程
    this.event_manager.add_handler("load", async (props) => {
      const new_document = (await this.saver.load_node_from_tdo(
        props.event.tdo
      )) as DocumentNode;
      this.document.set(new_document);
    });

    // 注册保存流程
    this.event_manager.add_handler("save", this.handlers.save);
  }
}
