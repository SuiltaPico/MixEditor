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

  - [x] `NodeManager` 的设计和实现

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
  
  - [x] `EventManager`

    `EventManager` 负责管理事件的监听和触发，支持监听器之间的依赖关系管理。

    `EventManager` 通过有向无环图(DAG)来管理监听器之间的依赖关系，确保监听器按照正确的顺序触发。

    监听器的依赖关系具有以下特征：
    1. 无环性：监听器之间的依赖关系不能形成循环。
    2. 确定性：相同的依赖关系总是产生相同的触发顺序。
    3. 缓存优化：触发顺序会被缓存以提高性能，仅在添加或删除监听器时重新计算。

    - [x] 监听器管理
    监听器管理包含两个主要操作：
    1. add_handler：添加新的事件监听器
      * **依赖声明**：可以指定该监听器依赖的其他监听器
      * **循环检测**：在添加依赖关系时会检查是否形成循环依赖
      * **错误处理**：如果检测到循环依赖，会抛出错误
    2. remove_handler：移除已有的事件监听器
      * **依赖清理**：会同时清理与该监听器相关的所有依赖关系
      * **缓存更新**：移除监听器后会清除相关的顺序缓存

    - [x] 事件触发流程
    事件触发时会按照以下步骤执行：
    1. 获取触发顺序：
      * 优先使用缓存的触发顺序
      * 如果缓存不存在，则重新生成触发顺序
      * 生成过程使用拓扑排序确保依赖关系得到满足
    2. 按序执行：
      * 按照确定的顺序依次调用每个监听器
      * 保证依赖的监听器先于被依赖的监听器执行

    - [x] 性能优化
    EventManager 采用了多项性能优化措施：
    1. 触发顺序缓存：
      * 使用 `handler_order_cache_map` 缓存计算好的触发顺序
      * 仅在监听器变更时清除缓存
    2. 高效的依赖关系存储：
      * 使用 `BiRelationMap` 存储双向的依赖关系
      * 支持快速查找监听器的祖先和子孙关系

  - [ ] `Saver`

    `Saver` 负责将编辑器的数据转换为传输数据对象，并提供保存和加载功能。
    
    `Saver` 还额外管理序列化器，序列化器可以将无引用的 JS 对象转换为 JSON、XML、SQL 等字符串格式或者二进制格式。

    传输数据对象是一个数据格式，其符合以下特征：
    1. 精简表示：传输数据对象是文档状态的精简表示，可以被还原为编辑器节点树和其内部状态。
    2. 易于序列化：传输数据对象中不包含任何循环引用，可以被序列化器简单序列化。

    - [ ] 保存流程
    保存流程负责将文档状态计算为传输数据对象，其分为三个子流程：
    1. before_save：在保存之前，会触发 `.before_save` 事件，允许插件进行一些准备工作。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并不会阻塞保存流程。
    2. save：保存数据，待 `before_save` 的所有监听器执行完毕后，执行 `save` 方法。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并会阻塞 `after_save`流程。
    3. after_save：保存成功后，会触发 `.after_save` 事件，允许插件进行一些收尾工作。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并不会阻塞其它流程。

    保存数据的流程是自上而下的，编辑器仅会通知根节点保存。而根节点的内部保存流程决定是否有必要继续调用子节点的保存流程。一般来说，保存的流程是自上而下的，但这并非强制要求，而是完全取决于各个节点的保存流程的实现。

    - [ ] 序列化流程
    序列化流程以保存流程生成的传输数据对象和序列化器为输入，输出序列化后的字符串或其他任意类型的二进制数据。

    - [ ] 加载流程
    加载流程负责将传输数据对象生成文档节点树和生成节点的内部状态，其分为三个子流程：
    1. before_load：在加载之前，会触发 `.before_load` 事件，允许插件进行一些准备工作。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并不会阻塞加载流程。
    2. load：加载数据，待 `before_load` 的所有监听器执行完毕后，执行 `load` 方法。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并会阻塞 `after_load`流程。
    3. after_load：加载成功后，会触发 `.after_load` 事件，允许插件进行一些收尾工作。
      * **支持异步流程**
      * **错误处理**：如果流程中发生错误，并不会阻塞其它流程。

    加载的流程是自上而下的，编辑器仅会调用文档根节点的加载流程。而根节点的内部加载流程决定是否有必要继续调用子节点的加载流程。一般来说，加载的流程是自上而下的，但这并非强制要求，而是完全取决于各个节点的加载流程的实现。

    - [ ] 反序列化流程
    反序列化流程以序列化后的字符串或其他任意类型的二进制数据和序列化器为输入，输出传输数据对象。


## `@mixeditor/browser-view`

  `@mixeditor/browser-view` 是 `@mixeditor` 编辑器在浏览器端的视图层实现，负责将 `@mixeditor/core` 定义的抽象数据模型渲染成用户可见的界面，并处理用户交互，将其转化为 `@mixeditor/core` 可理解的操作（`Operation`）。它作为 `@mixeditor/core` 与用户界面之间的桥梁，承担着至关重要的作用。

  **核心职责**：
  * **DOM 渲染：** 根据 `@mixeditor/core` 的数据模型，构建并渲染真实的 DOM 结构。
  * **事件处理：** 监听并捕获键盘、鼠标、触摸及剪贴板等用户输入事件。
  * **事件转换：** 将浏览器事件解析并转换为 `@mixeditor/core` 可处理的 `Operation`。
  * **光标与选区管理：** 控制并渲染编辑器的光标位置和选区范围。
  * **视图更新：** 利用 SolidJS 的响应式机制，高效地更新视图，确保与 `@mixeditor/core` 数据模型同步。

  - [x] `NodeRenderer`
    `NodeRenderer` 是 `@mixeditor/browser-view` 的核心组件。    

    * 其负责将 `@mixeditor/core` 中的单个 `Node` 渲染成对应的 DOM 元素。
    * 其能够响应 `Node` 状态变化，自动更新渲染后的 DOM。
    * 其生命周期与 `Node` 及其上下文同步，随 `Node` 或其上下文销毁而销毁。

  - [ ] `NodeRendererManager`
    `NodeRendererManager` 负责管理所有已注册的 `NodeRenderer`。
    * 负责 `NodeRenderer` 的注册、卸载、查找以及根据 `Node` 类型选择合适的 `NodeRenderer`。
    * 支持插件注册自定义 `NodeRenderer` 以实现自定义渲染逻辑。
  - [ ] `DocumentRenderer`
    `DocumentRenderer` 是整个文档渲染的入口。

    * **简介**：`DocumentRenderer` 依赖 `NodeRendererManager` 获取并应用相应的 `NodeRenderer`。
    * **渲染流程**：从 `root_node` 出发，递归遍历 `Node` 树，调用相应的 `NodeRenderer` 渲染每个 `Node`。在第一次渲染后，会缓存 `Node` 与 `NodeRenderer` 的映射关系，以便后续渲染时直接使用。
    * **缺少 `NodeRenderer` 的处理**：对于缺少对应 `NodeRenderer` 的 `Node`，会自动创建默认 `NodeRenderer` 并发出警告，提示开发者注册自定义 `NodeRenderer`。
    * **渲染器更新**：`NodeRendererManager` 更新后，`DocumentRenderer` 会自动重新渲染整个文档，对每一个被渲染的 `Node` 进行一次渲染器检查，决定是否使用缓存还是新的 `NodeRenderer`，再使用 Solidjs 高效的 DOM 对比算法插入新元素。以确保尽量减少元素创建和元素插入的计算。
    * **性能问题**： 由于 Solid.js 的更新需要 Signal 机制才能触发，在渲染器更新的前提下，无论是为所有组件实例都创建一个 Signal 然后遍历去触发 Signal，还是创建一个中央 Signal，然后触发 Signal 去更新所有组件实例，都会导致不必要的 CPU 开销和内存开销。后续会新建一个 Solid.js 的 分支以解决这个问题。

