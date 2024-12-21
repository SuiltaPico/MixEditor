# 任务跟踪
本文档用于记录项目开发过程中的任务跟踪，以及工作时的思考记录，以供后续参考。

## 项目架构设计
  本项目采用基于 **Turborepo + pnpm workspace** 的 **monorepo** 方式进行管理，以有效解决多包之间的依赖问题，提升开发效率和代码复用性。项目结构清晰，主要分为三个核心目录：`packages`、`apps` 和 `plugins`。

  * **`packages`**: 存放所有**核心**、**可复用**的代码包，每个包都是一个独立的 npm 包，可以单独发布和使用。这些包提供了编辑器的基础功能和通用组件。
  * **`apps`**: 存放所有**应用级**的项目，例如 MixEditor 的官方文档、在线演示环境 (playground) 等。这些应用依赖于 `packages` 中的核心包构建。
  * **`plugins`**: 存放所有**插件**，每个插件都是一个独立的 npm 包，用于扩展编辑器的功能。插件可以依赖 `packages` 中的核心包，并注册到 `@mixeditor/core` 中，从而增强编辑器的能力。

  此外，`docs` 文件夹用于存放项目的所有文档，包括设计文档、API 文档、使用教程等。

  **目录结构概览：**
  ```
  mixeditor/
  ├── apps/
  │   ├── docs/         # MixEditor 文档站点
  │   └── playground/   # MixEditor 在线演练场
  ├── packages/
  │   ├── core/         # 编辑器核心逻辑 (@mixeditor/core)
  │   ├── browser-view/ # 浏览器渲染层 (@mixeditor/browser-view)
  │   └── ...           # 其他核心包
  ├── plugins/
  │   ├── plugin-a/     # 插件 A (@mixeditor/plugin-a)
  │   ├── plugin-b/     # 插件 B (@mixeditor/plugin-b)
  │   └── ...           # 其他插件
  └── docs/             # 项目文档
      ├── design.md     # 设计文档
      ├── api.md        # API 文档
      └── ...
  ```

## `@mixeditor/core`

  `@mixeditor/core` 包负责处理编辑器的核心功能，例如操作管理、历史记录管理等。它提供了插件扩展机制，允许开发者通过插件自定义编辑器的行为。

  该包主要由以下几个部分组成：
  * `PluginManager`
  * `Node`、`NodeManager`
  * `Operation`、`OperationManager`
  * `HistoryManager`
  * `SelectionManager`

  - [x] `PluginManager` 的设计和实现

    使用了 `@mauchise/plugin-manager` 来管理插件的注册、卸载和生命周期。

  - [x] `Operation`、`OperationManager` 的设计和实现

    * **`Operation`**: `Operation` 是编辑器中**最小的操作单元**，代表用户对编辑器进行的一次原子操作，例如插入文本、删除文本、设置样式等。每个 `Operation` 都包含执行该操作所需的所有信息。
    * **`OperationManager`**: `OperationManager` 是 `Operation` 的管理器，负责管理 `Operation` 的执行、撤销、错误处理和合并。

    **工作流程:**
    1. 当用户执行一个操作时，编辑器会创建一个 `Operation` 对象。
    2. `OperationManager` 根据 `Operation` 的 `type` 查找对应的 `OperationBehavior`。
    3. 如果找到了对应的 `OperationBehavior`，则将 `Operation` 交给对应的执行器执行。
    4. 如果没有找到对应的 `OperationBehavior`，则抛出错误。

  - [x] `HistoryManager` 的设计和实现

    `HistoryManager` 负责管理编辑器的操作历史，提供**撤销 (undo)** 和**重做 (redo)** 功能。它被设计为**异步串行执行**，确保操作的执行顺序和一致性。

    **核心特性:**

    * **异步串行执行:** `HistoryManager` 内部维护一个操作队列，所有操作都按照顺序执行。在同一时间，只有一个操作在执行中。操作的执行和撤销都是异步的，这意味着操作的执行不会阻塞主线程，提升了编辑器的响应速度。
    * **环形队列存储:** `HistoryManager` 使用**环形队列**来存储操作历史。环形队列具有以下优点：
      * **固定大小:** 可以限制历史记录的数量，避免内存占用过高。
      * **高效访问:** 提供 O(1) 的时间复杂度来访问队首和队尾元素，以及 O(1) 的时间复杂度来添加和删除元素。
    * **提前撤销:** `HistoryManager` 支持**提前撤销**功能。当一个 `Operation` 还在执行队列中但尚未被执行时，如果用户此时触发了撤销操作，`HistoryManager` 会直接将该 `Operation` 从队列中移除，而不会执行其撤销逻辑，从而优化性能。

  - [ ] `Node` 的数据模型

    `Node` 是编辑器中的基本组成单元，代表编辑器中的一个节点，例如一个文本节点、一个块节点等。
    
    `Node` 可以包含 0 到多个子节点，每个子节点都是一个 `Node` 实例。当节点没有子节点时，其子节点列表为空；当节点在某个位置上没有子节点时，该位置的子节点为 falsy。`Node` 通过这种方式构成树状数据结构。

    每个 `Node` 都包含以下基本属性：
    * `type`: 字符串类型，用于标识节点的类型，例如 `text`、`paragraph`、`image` 等。
    * `data`: 用于存储节点的内容。`data` 的数据类型根据 type 的不同而不同。例如，`text` 类型的 `Node` 的 `data` 属性通常是一个字符串，而 `image` 类型的 `Node` 的 `data` 属性可能是一个包含图片 URL 和其他属性的对象。

  - [ ] `NodeManager` 的设计和实现

    `NodeManager` 负责管理 `Node` 相关的处理函数和元数据，主要职责包括：

    * 提供 `Node` `的通用操作接口：NodeManager` 管理了一系列通用的 Node 操作接口，这些接口通过 `NodeBehavior` 接口定义，并由 `NodeManager` 统一调度执行。这些接口包括：

      * `get_child(node, index)`: 获取指定节点的指定索引的子节点。
      * `get_children(node)`: 获取指定节点的所有子节点。
      * `get_children_count(node)`: 获取指定节点的子节点数量。
      * `serialize(node)`: 将 Node 序列化为 JSON 字符串。
      * `deserialize(jsonString)`: 将 JSON 字符串反序列化为 Node。
      * `clone(node)`: 克隆一个 Node。
      * `slice(node, from, to)`: 切割一个 Node。
      * `handle_event(node, event)`: 处理指定节点的指定事件。
    * 附加信息：
      * 标签：
        标签是一个字符串，用于标识 `Node` 的类别或特性。例如，`text` 节点通常拥有 `inline` 标签，表示它是一个行内元素；`paragraph` 节点通常拥有 `block` 标签，表示它是一个块级元素。

        标签的主要作用是方便对 `Node` 进行分类和检索。通过标签，可以快速过滤和查找特定类型的 `Node`，这在编辑器操作中非常有用。例如：
        * 在执行排版操作时，可以通过 `block` 标签快速找到所有块级元素。
        * 在进行样式设置时，可以通过 `inline` 标签快速找到所有行内元素。
        * 在实现自定义的编辑器功能时，可以通过自定义标签来标记和操作特定的 `Node`。

        标签之间可以存在继承关系，形成一个有向无环图 (DAG)。子标签会继承父标签的所有特性。例如，可以定义一个 `formatting` 标签，然后让 `bold`、`italic`、`underline` 等标签继承自 `formatting` 标签。这样，所有具有 `bold`、`italic`、`underline` 标签的 `Node` 也都隐含地具有 `formatting` 标签，方便进行统一的操作。使用有向无环图可以避免循环继承的问题，保证标签系统的稳定性和可维护性。

  - [x] `SelectionManager` 的设计和实现

    `SelectionManager` 负责管理编辑器的光标位置和选区，提供统一的选区操作接口。

    **核心功能：**
    * **选区模型：** 使用 `{ start, end }` 的数据结构表示选区，其中：
      * `start`：选区起始位置
      * `end`：选区结束位置（当 `start === end` 时表示光标位置）
    
    * **选区操作：**
      * `setSelection(start, end)`：设置选区范围
      * `getSelection()`：获取当前选区
      * `collapse(toStart = true)`：折叠选区到起点或终点
      * `extend(position)`：扩展选区到指定位置
    
    * **事件通知：**
      * 提供 `onSelectionChange` 事件，当选区发生变化时通知订阅者
      * 支持多个视图层同步选区状态

    * **选区验证：**
      * 确保选区位置的合法性
      * 处理选区跨节点的情况
      * 规范化选区（确保 start <= end）

## `@mixeditor/browser-view`

  `@mixeditor/browser-view` 负责浏览器端视图渲染和用户交互的关键模块。它充当了 `@mixeditor/core` 抽象数据模型与用户界面之间的桥梁。
  
  它负责管理渲染器和调度渲染器，组合 `@mixeditor/core` 提供的抽象数据模型所对应的渲染器，将其渲染成用户可见的界面。它也处理用户的输入事件，将其转化为 `Operation` 提交给 `@mixeditor/core` 处理。

  **核心功能:**

  `@mixeditor/browser-view` 的核心功能是将 `@mixeditor/core` 定义的抽象数据模型转化为用户可见的、可交互的编辑器界面，并处理用户输入，将其转化为 `@mixeditor/core` 可理解的操作（`Operation`）。

  **主要职责:**
  * **DOM 渲染:** 基于 `@mixeditor/core` 提供的数据模型，构建并渲染真实的 DOM 结构，呈现给用户。
  * **事件处理:** 监听并捕获浏览器中的各种用户输入事件，包括键盘事件、鼠标事件、触摸事件以及剪贴板事件等。
  * **事件转换:** 将原始的浏览器事件解析并转换为 `@mixeditor/core` 能处理的 `Operation`，从而驱动数据模型的更新。
  * **光标与选区管理:** 精确控制并渲染编辑器的光标位置和选区范围，提供直观的视觉反馈。
  * **视图更新:** 利用 **SolidJS** 的响应式 **effect** 机制，当 `@mixeditor/core` 中的数据模型发生变更时，`@mixeditor/browser-view` 能够高效地更新视图，确保视图与数据模型始终保持同步。

  - [x] `NodeRenderer` 的设计和实现
  
    `NodeRenderer` 是 `@mixeditor/browser-view` 的核心组件之一，负责将单个 `Node`（`@mixeditor/core` 中的节点）渲染成对应的 DOM 元素。它还具备响应 `Node` 状态变化的能力，能够自动更新渲染后的 DOM 元素，保持视图与数据的同步。

    `NodeRenderer` 的生命周期与 `Node` 的生命周期相同，当 `Node` 或者其上下文被销毁时，`NodeRenderer` 也会被销毁。

  - [ ] `NodeRendererManager` 的设计和实现

    `NodeRendererManager` 负责管理所有已注册的 `NodeRenderer`。它的主要职责包括 `NodeRenderer` 的注册、卸载、查找以及基于 `Node` 类型选择合适的 `NodeRenderer`。

  - [ ] `DocumentRenderer` 的设计和实现

    `DocumentRenderer` 是整个文档渲染的入口。它依赖 `NodeRendererManager` 来获取并应用相应的 `NodeRenderer`。`DocumentRenderer` 从 MixEditor 的 `root_node` 出发，递归地遍历整个 `Node` 树，并调用相应的 `NodeRenderer` 将每个 `Node` 渲染成 DOM 结构。

    对于缺少对应 `NodeRenderer` 的 `Node`，`DocumentRenderer` 会自动创建一个默认的 `NodeRenderer` 进行渲染，并向开发者发出警告，提示他们为该 `Node` 类型注册自定义的 `NodeRenderer`，以实现更精细的控制。