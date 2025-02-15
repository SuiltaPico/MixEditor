import { PluginManager } from "@mauchise/plugin-manager";
import { createSignal } from "@mixeditor/common";
import { EventHandler, EventManager } from "./event";
import { DocumentNode, DocumentTDO, save_document } from "./node/document";
import { AllNodeTypes } from "./node/Node";
import { NodeHandlerMap, NodeManager } from "./node/NodeManager";
import { HistoryManager } from "./operation/HistoryManager";
import { OperationManager } from "./operation/Operation";
import { MixEditorPlugin, MixEditorPluginContext } from "./plugin";
import { Saver } from "./saver/saver";
import { SelectedData, Selection } from "./selection";
import {
  CaretNavigateEnterDecision,
  execute_caret_navigate_from_selected_data,
  CaretNavigateFrom,
} from "./resp_chain/caret_navigate";
import { NavigateDirection } from "./common/navigate";

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
  delete_selected: {
    type: "delete_selected";
  };
}

export class MixEditor {
  /** 操作管理器。 */
  operation_manager = new OperationManager(this);
  /** 历史管理器。 */
  history_manager = new HistoryManager(this.operation_manager);

  /** 文档节点管理器。 */
  node_manager: NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes> =
    new NodeManager<NodeHandlerMap<AllNodeTypes>, AllNodeTypes>(this);
  /** 文档。 */
  document = createSignal(new DocumentNode(this.node_manager.generate_id()));

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
    /** 光标导航流程，根据指定方向跳转到下一个或上一个位置 */
    caret_navigate: async ({
      event,
      wait_dependencies,
    }: Parameters<EventHandler<Events["caret_navigate"]>>[0]) => {
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
    });

    // 注册文档节点保存行为
    this.node_manager.register_handlers("document", {
      save: save_document,
      get_children_count: (_, node) => {
        return node.children.get().length;
      },
      get_child: (_, node, index) => {
        return node.children.get()[index] as any;
      },
      get_index_of_child: (_, node, child) => {
        return node.children.get().indexOf(child);
      },
      handle_caret_navigate: (_, node, to, direction, from) => {
        const children_count = node.children.get().length;
        const to_prev = direction === NavigateDirection.Prev;

        to += direction;

        if (from === CaretNavigateFrom.Child) {
          // 从子区域跳入
          if ((to_prev && to < 0) || (!to_prev && to >= children_count)) {
            // 超出该方向的尾边界，则跳过
            return CaretNavigateEnterDecision.skip;
          }
          // 进入下一个子区域，注意前向时索引需要-1
          return CaretNavigateEnterDecision.enter_child(to_prev ? to - 1 : to);
        } else if (from === CaretNavigateFrom.Parent) {
          // 根区域不应该从父区域进入
          throw new Error(
            "根区域顶层索引约定为无界，所以不可能从根区域顶层索引进入。这可能是插件直接设置了选区导致的错误选择了根区域的索引。"
          );
        } else {
          // 从自身索引移动（Self），根区域不应该有这种情况
          throw new Error("根区域不应该有自身索引移动的情况");
        }
      },
    });

    // 注册文档节点加载行为
    this.saver.register_loader("document", async (tdo) => {
      const dtdo = tdo as DocumentTDO;
      const nodes = await Promise.all(
        dtdo.children.map((child) => this.saver.load_node_from_tdo(child))
      );
      const document = new DocumentNode(
        this.node_manager.generate_id(),
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
    // 注册光标导航流程
    this.event_manager.add_handler(
      "caret_navigate",
      this.handlers.caret_navigate
    );
    // 注册删除选区事件处理
    this.event_manager.add_handler(
      "delete_selected",
      async ({ wait_dependencies }) => {
        await wait_dependencies();

        const selected = this.selection.get_selected();
        if (!selected) return;

        if (selected.type === "collapsed") {
          // 如果是光标，不执行任何操作
          return;
        }

        // 如果是范围选区，执行删除操作
        if (selected.type === "extended") {
          const { start, end } = selected;

          // 创建并执行删除范围的操作
          await this.history_manager.execute({
            id: this.node_manager.generate_id(),
            type: "delete_range",
            data: {
              start,
              end,
              start_path: [start.child_path],
              end_path: [end.child_path],
            },
          });

          // 删除后，将选区设置为起始位置
          this.selection.collapsed_select(start);
        }
      }
    );
  }
}
