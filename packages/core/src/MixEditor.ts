import { PluginManager } from "@mauchise/plugin-manager";
import { createSignal } from "@mixeditor/common";
import { EventHandler, EventManager } from "./event";
import { DocumentNode, DocumentTDO, save_document } from "./node/document";
import { AllNodeTypes } from "./node/Node";
import { NodeHandlerMap, NodeManager } from "./node/NodeManager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { Saver } from "./saver";
import { Selection } from "./selection";

export interface Events {
  init: {
    type: "init";
  };
  before_save: {
    type: "before_save";
  };
  save: {
    type: "save";
  };
  after_save: {
    type: "after_save";
    save_result: any;
  };
  before_load: {
    type: "before_load";
    tdo: DocumentTDO;
  };
  load: {
    type: "load";
    tdo: DocumentTDO;
  };
  after_load: {
    type: "after_load";
  };
  caret_move: {
    type: "caret_move";
    direction: "next" | "prev";
  };
}

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager(this);
  /** 命令管理器。 */
  command_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager: NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes> =
    new NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes>(this);
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
      const tdo = await this.node_manager.execute_handler(
        "save",
        this.document.get()
      );
      event.context.save_result = tdo;
    },
    caret_move: async ({
      event,
      wait_dependencies,
    }: Parameters<EventHandler<Events["caret_move"]>>[0]) => {
      await wait_dependencies();
      const direction = event.direction;

      // 移动责任链

    },
  };

  async init() {
    await this.plugin_manager.init_plugins({ editor: this });
    this.event_manager.emit({ type: "init" });
  }

  constructor(config: { plugins: MixEditorPlugin[] }) {
    // 注册插件
    config.plugins.forEach((plugin) => {
      this.plugin_manager.register(plugin);
    });

    // 注册文档节点保存行为
    this.node_manager.register_handler("document", "save", save_document);

    // 注册文档节点加载行为
    this.saver.register_loader("document", async (tdo) => {
      const dtdo = tdo as DocumentTDO;
      const nodes = await Promise.all(
        dtdo.children.map((child) => this.saver.load_node_from_tdo(child))
      );
      const document = new DocumentNode(
        createSignal(nodes),
        dtdo.schema_version,
        dtdo.created_at,
        dtdo.modified_at
      );
      nodes.forEach((node) => {
        this.node_manager.set_parent(node, document);
      });
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
