import { PluginManager } from "@mauchise/plugin-manager";
import { createSignal } from "@mixeditor/common";
import { NavigateDirection } from "./common/navigate";
import { TagManager } from "./common/tag_manager";
import { MarkManager } from "./entity/mark/manager";
import {
  MarkTDO,
  MarkTDOHandlerManager,
  MarkTDOHandlerMap,
} from "./entity/mark/mark_tdo";
import { NodeManager } from "./entity/node/manager";
import {
  NodeManagerHandlerMap,
  NodeManagerStrategyMap,
} from "./entity/node/maps";
import { AllNodeTypes } from "./entity/node/node";
import {
  NodeTDO,
  NodeTDOHandlerManager,
  NodeTDOHandlerMap,
} from "./entity/node/node_tdo";
import {
  create_DocumentNode,
  init_document,
} from "./entity/node/nodes/document";
import { AllEvents } from "./event";
import { handle_delete_selected } from "./event/delete_select";
import {
  EventHandler,
  EventManager,
  MixEditorEventManagerContext,
} from "./event/event";
import { HistoryManager } from "./operation/history_manager";
import { OperationManager } from "./operation/operation";
import { init_operations } from "./operation/operations";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { execute_caret_navigate_from_selected_data } from "./resp_chain/caret_navigate";
import { Saver } from "./saver/saver";
import { SelectedData, Selection } from "./selection";

export type MixEditorNodeManager = NodeManager<
  AllNodeTypes,
  NodeManagerHandlerMap<AllNodeTypes>,
  NodeManagerStrategyMap
>;

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager(this);
  /** 历史管理器。 */
  history_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager: MixEditorNodeManager = new NodeManager<AllNodeTypes>(this);
  /** 文档节点传输数据对象管理器。 */
  node_tdo_manager: NodeTDOHandlerManager<NodeTDOHandlerMap<any>, NodeTDO> =
    new NodeTDOHandlerManager<NodeTDOHandlerMap<any>, NodeTDO>(this);

  /** 文档标记管理器。 */
  mark_manager = new MarkManager(this);
  /** 文档标记传输数据对象管理器。 */
  mark_tdo_manager: MarkTDOHandlerManager<MarkTDOHandlerMap, MarkTDO> =
    new MarkTDOHandlerManager<MarkTDOHandlerMap, MarkTDO>(this);

  /** 节点标签管理器。 */
  tag_manager = new TagManager<string>();

  /** 文档。 */
  document = createSignal(
    this.node_manager.create_node(create_DocumentNode, {
      children: [],
    })
  );

  /** 事件管理器。 */
  event_manager: EventManager<
    AllEvents[keyof AllEvents],
    MixEditorEventManagerContext
  > = new EventManager<
    AllEvents[keyof AllEvents],
    MixEditorEventManagerContext
  >({
    editor: this,
  });
  /** 插件管理器。 */
  plugin_manager = new PluginManager<MixEditorPluginContext>();
  /** 文档选区管理。 */
  selection = new Selection(this);
  /** 文档保存器。 */
  saver = new Saver(this);
  /** 事件处理器。 */
  handlers = {
    save: async ({
      event,
      wait_dependencies,
    }: Parameters<
      EventHandler<AllEvents["save"], MixEditorEventManagerContext>
    >[0]) => {
      await wait_dependencies();
      const tdo = await this.node_manager.execute_handler(
        "to_tdo",
        this.document.get()
      );
      event.context.save_result = tdo;
    },
    /** 光标导航流程，根据指定方向跳转到下一个或上一个位置 */
    caret_navigate: async ({
      event,
      wait_dependencies,
    }: Parameters<
      EventHandler<AllEvents["caret_navigate"], MixEditorEventManagerContext>
    >[0]) => {
      await wait_dependencies();
      const direction = event.direction;
      const selected = this.selection.get_selected();
      if (!selected) return;

      let result: SelectedData | undefined;

      if (selected.type === "collapsed") {
        result = await execute_caret_navigate_from_selected_data(
          this,
          selected.start,
          direction
        );
        if (!result) return;
        this.selection.collapsed_select(result);
      } else if (selected.type === "extended") {
        // 退化成 collapsed 类型
        if (direction === NavigateDirection.Prev) {
          this.selection.collapsed_select(selected.start);
        } else {
          this.selection.collapsed_select(selected.end);
        }
      }
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

    // 初始化文档节点
    init_document(this);

    // 初始化操作
    init_operations(this);

    // 注册节点的默认处理器
    this.node_manager.register_handlers("default", {
      get_child: (_, node, index) => {
        return undefined;
      },
      get_children_count: (_, node) => {
        return 0;
      },
      get_index_of_child: (_, node, child) => {
        return -1;
      },
      get_children: (_, node) => {
        return [];
      },
      delete_children: async (_, node, from, to) => {
        return [];
      },
    });

    // 注册保存流程
    this.event_manager.add_handler("save", this.handlers.save);
    // 注册光标导航流程
    this.event_manager.add_handler(
      "caret_navigate",
      this.handlers.caret_navigate
    );
    // 注册删除选区事件处理
    this.event_manager.add_handler("delete_selected", handle_delete_selected);
  }
}
