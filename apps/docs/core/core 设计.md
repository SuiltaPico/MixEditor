# 核心设计（`@mixeditor/core`）
核心负责定义操作、实体、上下文等核心概念。并提供基础实现。
## 定义
#### 1. 通用模式简介
##### 1.1 黑盒-行为-处理器模式
定义黑盒对象、行为定义、行为处理器三个概念。
* **黑盒对象**：是不做预设的对象，仅包含类型字段，内部结构由实现者自己决定。
* **行为定义**：定义黑盒对象可有的行为，定义如下：
	$$Behavior = (Type, ParamsSchema)$$
* **行为处理器**：实现黑盒对象行为的函数。

这种模式目的在于让插件方便地动态扩展功能。在核心的设计中，实体、实体TDO和操作都使用了这种模式。

定义运算：
$$
\begin{align*}
& CoreBehavior<ExtendParam, ExCtx> \ = \\
& \quad Behavior \ \& \ (Behavior.ParamsSchema \ \& \ ExtendParam \ \& \{ex\_ctx: ExCtx\})
\end{align*}
$$
##### 1.2 DAG 动态执行顺序管理
在管理者注册执行器时，只需设定监听器前后驱节点即可完成顺序编排。管理者也可以重新编排一些自己依赖的前后驱实体以构造新的执行顺序。

在有执行顺序需求的场景下，使用 DAG 来管理能轻松解决传统情况的优先级安排问题、异步并发、循环依赖等问题。在核心的设计中，插件初始化和事件总线（管线编排管理器）都使用了这种模式。
#### 2. 实体相关
##### 2.1 实体（$Ent$）
实体是内容的最小单元，对编辑器来说是黑盒，编辑器仅能通过实体行为访问实体。每个实体定义为三元组：  
$$Ent_i = (ID, Type, State)$$  
其中：  
1. **唯一标识（$ID$）**：全域唯一，用于实体追踪。  
2. **类型标识（$Type$）**：确定实体语义类别，满足 $Type \in EntCtx.Schemas.Type$。  
3. **状态（$State$）**：实体属性集合，符合 $EntCtx.Schemas[Type].StateSchema$ 的格式定义。  
    - **实体关系（可选）**：通过引用其他实体 $ID$ 表达树状、图状或链状关系。  
##### 2.2 实体行为（$EntBehavior$）
每个实体行为定义为二元组：  
$$EntBehavior<ExCtx> \ = \ CoreBehavior<\{target: Ent\}, ExCtx)>$$

类型定义为：
```ts
interface BaseEntBehaviorParams {
  target: Ent;
}
type BuildEntBehaviorParams<T extends object> = BaseEntBehaviorParams & T;
type EntBehaviorHandler<TParams extends object, TResult> = (params: BuildEntBehaviorParams<TParams>) => TResult;
```

核心预设了这些实体行为：
```ts
interface EntBehaviorMap {
  to_tdo: EntBehaviorHandler<{}, TDO>;
}
```
##### 2.3 实体模式（$EntSchema$）
实体模式描述了某一类型的实体的所有信息，包含实体类型、实体状态类型的定义、实体的标签和实体各行为处理器的实现。定义为如下元组：  
$$EntSchema = (Type, StateSchema, Tags, BehaviorHandlers)$$
##### 2.4 实体TDO（$EntTDO$）
实体TDO是用于持久化存储实体的对象，仅保留必要数据。定义为三元组：
$$EntTDO = (ID, Type, State)$$
其中：
- **唯一标识（$ID$）**：全域唯一，用于实体追踪。
- **类型标识（$Type$）**：确定实体语义类别，满足 $Type \in EntCtx.Schemas.Type$。
- **状态（$State$）**：实体属性集合，符合 $EntCtx.Schemas[Type].StateSchema$ 的格式定义。
##### 2.5 实体TDO行为（$EntTDOBehavior$）
每个实体TDO行为定义为二元组：  
$$EntTDOBehavior<ExCtx> \ = \ CoreBehavior<\{target: Ent\}, ExCtx)>$$
类型定义为：
```ts
interface BaseEntTDOBehaviorParams {
  target: Ent;
}
type BuildEntTDOBehaviorParams<T extends object> = BaseEntTDOBehaviorParams & T;
type EntTDOBehaviorHandler<TParams extends object, TResult> = (params: BuildEntTDOBehaviorParams<TParams>) => TResult;
```

核心预设了这些实体行为：
```ts
interface EntTDOBehaviorMap {
  to_ent: EntTDOBehaviorHandler<{}, Ent>;
}
```
##### 2.6 实体TDO模式（$EntTDOSchema$）
实体TDO模式描述了某一TDO类型的实体的所有信息，包含类型、实体TDO状态类型的定义和实体TDO的各行为处理器的实现。定义为如下元组：  
$$EntSchema = (Type, StateSchema, BehaviorHandlers)$$
##### 2.7 领域上下文表（$DomainCtxMap$）
领域上下文（$DomainCtx$）用于放置特定领域针对某个实体临时产生的数据，领域上下文表维护一个实体到领域上下文的映射。定义为元组：
$$
DomainCtx = (Type, Map: \{NodeRef_i: DomainCtx_i\})
$$
##### 2.8 实体上下文（$EntCtx$）
实体上下文是实体和实体TDO的模式与行为的全局集合：  
$$
\begin{align*}
& EntCtx<ExCtx> = (\\
& \quad Schemas: \{EntSchema_i\}, \\
& \quad Behaviors: \{EntBehavior<ExCtx>_i\}, \\
& \quad DomainCtxMaps: \{ DomainCtxMap_i \} \\
& \quad TDOSchemas: \{EntTDOSchema_i\}, \\
& \quad TDOBehaviors: \{TDOBehavior_i\}, \\
& \quad ExCtx \\
)
\end{align*}
$$
##### 2.9 实体数据的用途区分
实体、实体TDO、领域上下文都是为了容纳实体的状态，但它们细分上有很大的区别，其区分如下：

| 特性   | 实体（$Ent$）    | 实体TDO（$TDO$）   | 领域上下文（$DomainCtx$）                 |
| ---- | ------------ | -------------- | ---------------------------------- |
| 来源   | 由实体模式定义      | 由实体模式定义        | 由领域上下文模式定义                         |
| 储存内容 | 储存实体的内容      | 储存实体内容的持久化格式数据 | 特定领域为实体拓展的内容                       |
| 目的   | 储存实体主要的运行时数据 | 持久化编辑器状态       | 1. 无侵入式地扩展实体运行时数据<br>2. 方便统一管理领域数据 |

#### 3. 内容相关
##### 3.1 根实体（$RootEnt$）
根实体是一个实体，内部是树形结构，自身作为子实体的根节点。定义为：
$$RootEnt = ("root", RootState)$$
#### 4. 操作相关
##### 4.1 操作（$Op$）
操作描述状态迁移 $S \xrightarrow{Op} S'$，定义为二元组：  
$$Op = (Type, Params)$$  
其中：  
1. **类型（$Type$）**：操作语义类别，满足 $Type \in OpCtx.Schemas.Type$。  
2. **参数（$Params$）**：操作参数，满足 $Ctx \in OpCtx.Schemas[Type].Params$。  
##### 4.2 逆操作（$Op^{-1}$）  
对任意 $Op$，若存在算法 $f_{inv}$ 使得 $Inv(Op) = f_{inv}(S, Op)$，则 $Op^{-1}$ 满足：  
$$S \xrightarrow{Op} S' \xrightarrow{Op^{-1}} S$$ 
逆操作是可选的。
##### 4.3 操作合并  
为优化存储，操作可按规则合并：  
1. **扩展合并**：同类型且参数可线性组合时，合并为 $\Delta_{merge} = (Type, f_{merge}(Params_1, Params_2))$。
2. **相消合并**：$Op$ 与 $Op^{-1}$ 合并时相互抵消。 
##### 4.4 操作行为（$OpBehavior$）
$OpBehavior$ 是 $Op$ 的执行方法。定义为：
$$OpBehavior<ExCtx> \ = \ CoreBehavior<\{target: Ent\}, ExCtx)>$$

类型定义为：
```ts
interface BaseOpBehaviorParams<ExCtx> {
  target: Op;
  ex_ctx: ExCtx;
}
type BuildOpBehaviorParams<TParams extends object, ExCtx> = BaseOpBehaviorParams<ExCtx> & TParams;
type OpBehaviorHandler<TParams extends object, TResult, ExCtx = {}> = (params: BuildOpBehaviorParams<TParams, ExCtx>) => TResult;
```

核心预设了这些操作行为：
```ts
interface OpBehavior {
  apply: OpBehaviorHandler<{}, void>;
  invert: OpBehaviorHandler<{}, void>;
  merge: OpBehaviorHandler<{
    target2: Op;
  }, Op>;
}
```
##### 4.5 操作模式（$OpSchema$）
操作模式是某个操作类型的参数和行为处理器实现：  
$$OpSchema = (Type, ParamsSchema, BehaviorHandlers)$$
##### 4.6 事务（$Transaction$）
事务是一种操作，是一系列的操作，定义为：
$$Transaction = ("transaction", TransactionCtx)$$
- **事务上下文（$TransactionCtx$）**：事务上下文，包含如下信息：
```ts
interface TransactionCtx {
  ops: Op[];
}
```
##### 4.7 操作执行流程
操作需通过操作和实体行为处理器执行：  
1. 根据 $Op.Type$ 匹配 $OpCtx.Behaviors$ 中的处理器。  
2. 调用处理器，按 $Params$ 调用 $EntCtx.Behaviors$ 中的处理器更改实体状态。  
##### 4.8 操作上下文（$OpCtx$）
操作模式与行为的全局集合：  
$$
\begin{align*}
& OpCtx<ExCtx> = ( \\
& \quad Schemas: \{OpSchema_i\},\\
& \quad Behaviors: \{OpBehavior<ExCtx>_i\},\\
& \quad ExCtx\\
& )
\end{align*}
$$

#### 5. 历史管理相关
##### 5.1 历史上下文（$HistoryCtx$）
历史上下文是一个缓冲区，其缓存已经发生过的操作，提供操作记录和撤销的功能。定义如下
$$HistoryCtx = (OpBuffer, RedoBuffer, Config)$$
其中：
* **操作缓冲区（$OpBuffer$）**：记录已经发生的操作。
* **重做缓冲区（$RedoBuffer$）**：记录已撤销，可重做的步骤。
* **配置（$Config$）**：储存历史上下文的配置。
#### 6. 管线相关
##### 6.1 管线（$Pipe$）
管线是由多阶段处理器构成的有向无环图（DAG），用于编排编辑器核心行为的执行流程。定义为：
$$
\begin{align*}
& Pipe=(\\
& \quad Type,\\
& \quad HandlerDatas: \{ PipeHandlerData_i \},\\
& \quad EventSchema\\
& )
\end{align*}
$$
其中：
- **类型（$Type$）**：管线的类型。
- **处理器数据集（$HandlerDatas$）**：管线的处理器，以及它们的连接信息。

管线执行时，将拓扑排序阶段并按依赖顺序调用处理器。
##### 6.2 处理器数据（$PipeHandlerData$）
处理器数据包含处理器，以及它们与锚点的连接信息，处理器会在前驱锚点完成后触发，然后通知后驱锚点自己已执行。

**锚点名称（$AnchorName$）** 是个字符串，会在管线内部产生**锚点（$Anchor$）**，用于支撑 DAG 的结构。

处理器数据定义如下：
$$
\begin{align*}
& PipeHandlerData = (\\
& \quad Handler,\\
& \quad PrevAnchors: \{ AnchorName_i \},\\
& \quad NextAnchors: \{ AnchorName_i \}\\
& )
\end{align*}
$$
其中：
* **处理器**：管线处理器，是个函数。
* **前驱锚点列表（$PrevAnchors$）**：记录需要等待其完成，自己才能执行的锚点名称列表。
* **后驱锚点列表（$NextAnchors$）**：记录自己完成后方可执行的锚点名称列表。
##### 6.3 事件（$Event$）
事件是管线执行过程中，向各个管线处理器传递的消息对象。定义为：
$$Event=(Type,Data,EventCtx,ExCtx)$$
其中：
- **类型（$Type$）**：管线的类型。
* **数据（Data）**：事件传递的数据。具有只读约束。
* **事件上下文（EventCtx）**：用于管线处理器向下级处理器或管线末端传递数据。
##### 6.4 事件模板（$EventSchema$）
事件模板定义了事件的类型。定义为：
$$Event=(Type,DataSchema,EventCtxSchema?)$$
- **类型（$Type$）**：管线的类型。
- **数据模板（$DataSchema$）**：事件携带的数据模板。
- **事件上下文（$EventCtxSchema$）（可选）**：事件上下文的模板。
##### 6.5 管线总线（$PipeBus$）
管线总线包含多个管线的信息。定义为：
$$PipeBus = \{Name_i: Pipe_i, \ ExCtx\}$$
#### 7. 选区相关
##### 7.1 选区（$Selection$）
选区用于标识选中实体或实体范围的抽象概念。定义为：
$$Selection=(Type,Data)$$
其中：
- **类型（$Type$）**：选区的类型。
* **数据（Data）**：选区的数据。记录选择的实体或实体范围。
##### 7.2 选区模板（$SelectionSchema$）
选区模板定义了选区的类型。定义为：
$$SelectionSchema=(Type,DataSchema)$$
- **类型（$Type$）**：选区的类型。
- **数据模板（$DataSchema$）**：选区的数据模板。
##### 7.3 选区上下文（$SelectionCtx$）
记录选区的信息，定义为：
$$SelectionCtx=(CurrSelection: Selection, SelectionSchemas: \{ SelectionSchema_i \})$$
#### 8. 序列化相关
##### 8.x 序列化器（$Serializer$）
##### 8.x 序列化模板（$SerializerSchema$）
##### 8.x 反序列化器（$Deserializer$）
##### 8.x 反序列化（$DeserializerSchema$）
##### 8.x 序列化上下文（$SerialCtx$）

#### 9. 插件相关
##### 9.x 插件上下文（$PluginCtx$）

#### 10. 核心上下文（$CoreCtx$）
核心上下文包含了 MixEditor 编辑器核心所需的所有运行环境，定义为：  
$$CoreCtx = (EntCtx, RootEnt, OpCtx, HistoryCtx, PipeCtx, SelectionCtx, SerialCtx, PluginCtx)$$
## 实现