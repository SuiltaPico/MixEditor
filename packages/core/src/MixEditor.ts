import { PluginManager } from "@mauchise/plugin-manager";
import { createSignal } from "@mixeditor/common";
import { NavigateDirection } from "./common/navigate";
import {
  DeleteSelectedEvent,
  handle_delete_selected,
} from "./event/delete_select";
import {
  EventHandler,
  EventManager,
  MixEditorEventManagerContext,
} from "./event/event";
import { MarkManager } from "./node/mark_manager";
import { AllNodeTypes } from "./node/node";
import { NodeHandlerMap, NodeManager } from "./node/node_manager";
import {
  create_DocumentNode,
  DocumentTDO,
  init_document,
} from "./node/nodes/document";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { init_operations } from "./operation/operations";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { execute_caret_navigate_from_selected_data } from "./resp_chain/caret_navigate";
import { Saver } from "./saver/saver";
import { SelectedData, Selection } from "./selection";
import { TDOHandlerMap, TDOManager } from "./node/tdo_manager";

export interface Events {
  /** 编辑器核心初始化。 */
  init: {
    type: "init";
  };
  before_save: {
    type: "before_save";
  };
  save: {
    type: "save";
    context: {
      save_result: any;
    };
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
  /** 光标导航。 */
  caret_navigate: {
    type: "caret_navigate";
    direction: NavigateDirection;
  };
  /** 删除选区。 */
  delete_selected: DeleteSelectedEvent;
}

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager(this);
  /** 历史管理器。 */
  history_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager: NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes> =
    new NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes>(this);
  /** 文档标记管理器。 */
  mark_manager = new MarkManager(this);
  /** 节点传输数据对象管理器。 */
  tdo_manager = new TDOManager<TDOHandlerMap<any>, any>(this);

  /** 文档。 */
  document = createSignal(
    this.node_manager.create_node(create_DocumentNode, {
      children: [],
    })
  );

  /** 事件管理器。 */
  event_manager: EventManager<
    Events[keyof Events],
    MixEditorEventManagerContext
  > = new EventManager<Events[keyof Events], MixEditorEventManagerContext>({
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
      EventHandler<Events["save"], MixEditorEventManagerContext>
    >[0]) => {
      await wait_dependencies();
      const tdo = await this.node_manager.execute_handler(
        "save",
        this.document.get()
      );
      event.context.save_result = tdo;
    },
    /** 光标导航流程，根据指定方向跳转到下一个或上一个位置 */
    caret_navigate: async ({
      event,
      wait_dependencies,
    }: Parameters<
      EventHandler<Events["caret_navigate"], MixEditorEventManagerContext>
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
