# 核心（`@mixeditor/core`）
核心负责定义操作、实体、上下文等核心概念。并提供基础实现。
## 定义
### 1. 内容（$Content$）
内容为实体集合 $Ct = \{Ent_i\}$。
### 1.1 实体（$Ent$）
每个实体定义为三元组：  
$$Ent_i = (ID, Type, State)$$  
其中：  
1. **唯一标识（$ID$）**：全域唯一，用于实体追踪。  
2. **类型标识（$Type$）**：确定实体语义类别，满足 $Type \in EntCtx.Schemas.Type$。  
3. **状态（$State$）**：实体属性集合，符合 $EntCtx.Schemas[Type].StateSchema$ 的格式定义。  
    - **实体关系（可选）**：通过引用其他实体 $ID$ 表达树状、图状或链状关系。  
#### 1.2 实体行为（$EntBehavior$）
定义实体行为的统一接口：  
$$EntBehavior = (Type, ParamsSchema)$$  
- **参数模式（$ParamsSchema$）**：行为参数的格式定义，即 $\{Name_i: Type_i\}$。  

类型定义为：

```ts
interface BaseEntBehaviorParams {
  target: Entity;
}
type BuildEntBehaviorParams<T extends object> = BaseEntBehaviorParams & T;
type EntBehaviorHandler<TParams extends object, TResult> = (params: BuildEntBehaviorParams<TParams>) => TResult;
```

#### 1.3 实体传输数据对象（$EntTDO$）
传输数据对象是实体的传输格式。定义为：
$$EntTDO = (ID, Type, State)$$
其中：
- **唯一标识（$ID$）**：全域唯一，用于实体追踪。
- **类型标识（$Type$）**：确定实体语义类别，满足 $Type \in EntCtx.Schemas.Type$。
- **状态（$State$）**：实体属性集合，符合 $EntCtx.Schemas[Type].StateSchema$ 的格式定义。

传输数据对象是实体用于传输的格式，不包含运行时信息。

#### 1.4 实体传输对象模式（$EntTDOSchema$）
定义实体类型的格式与行为：  
$$EntTDOSchema = (Type, StateSchema, Behaviors)$$   

#### 1.5 实体模式（$EntSchema$）
定义实体类型的格式与行为：  
$$EntSchema = (Type, StateSchema, Behaviors, TDOSchema: EntTDOSchema)$$  
- **状态模式（$StateSchema$）**：属性名与类型的映射，即 $StateSchema = \{Name_i: Type_i\}$。  
- **行为处理器（$Behaviors$）**：实现该类型实体的预期行为，需符合 $EntCtx.Behaviors$ 的定义。  
- **传输数据对象（$TDO$）**：实体的传输格式，需符合 $EntCtx.TDO$ 的定义。  

#### 1.6 实体上下文（$EntCtx$）
实体模式与行为的全局集合：  
$$EntCtx = (Schemas: \{EntSchema_i\}, Behaviors: \{EntBehavior_i\}, TDOBehaviors: \{TDOBehavior_i\})$$
### 2. 操作（$Op$）
操作描述状态迁移 $S \xrightarrow{Op} S'$，定义为二元组：  
$$Op = (Type, Ctx)$$  
其中：  
1. **类型（$Type$）**：操作语义类别，满足 $Type \in OpCtx.Schemas.Type$。  
2. **上下文（$Ctx$）**：操作上下文，满足 $Ctx \in OpCtx.Schemas[Type].Ctx$。  
#### 2.1 操作模式（$OpSchema$）
定义操作类型的格式与行为：  
$$OpSchema = (Type, Ctx, Behaviors)$$  
- **行为处理器（$Behaviors$）**：实现该类型操作的状态迁移逻辑，需符合 $OpCtx.Behaviors$ 的部分定义。  
#### 2.2 逆操作（$Op^{-1}$）  
对任意 $Op$，若存在算法 $f_{inv}$ 使得 $Inv(Op) = f_{inv}(S, Op)$，则 $Op^{-1}$ 满足：  
$$S \xrightarrow{Op} S' \xrightarrow{Op^{-1}} S$$ 
逆操作是可选的。
#### 2.3 操作合并  
为优化存储，操作可按规则合并：  
1. **扩展合并**：同类型且参数可线性组合时，合并为 $\Delta_{merge} = (Type, f_{merge}(Params_1, Params_2))$。  
2. **相消合并**：$Op$ 与 $Op^{-1}$ 合并时相互抵消。 
#### 2.4 操作行为（$OpBehavior$）
$OpBehavior$ 是 $Op$ 的执行方法。定义为：
$$
OpBehavior=(Type, ParamsSchema)
$$

类型定义为：
```ts
interface BaseOpBehaviorParams {
  target: Op;
}
type BuildOpBehaviorParams<T extends object> = BaseOpBehaviorParams & T;
type OpBehaviorHandler<TParams extends object, TResult> = (params: BuildOpBehaviorParams<TParams>) => TResult;
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

#### 2.5 事务
事务是一种操作，操作的序列和事务上下文，定义为：
$$Transaction = ("transaction", TransactionCtx)$$
- **事务上下文（$TransactionCtx$）**：事务上下文，包含如下信息：
```ts
interface TransactionCtx {
  ops: Op[];
}
```

#### 2.6 操作执行流程
操作需通过操作和实体行为处理器执行：  
1. 根据 $Op.Type$ 匹配 $OpCtx.Behaviors$ 中的处理器。  
2. 调用处理器，按 $Params$ 调用 $EntCtx.Behaviors$ 中的处理器更改节点状态。  
其中：
* 操作行为类型（$Type$）
  确定操作行为语义类别。
* 参数集模式（$ParamsSchema$）
  $ParamsSchema = \{Name_i: Type_i\}$
#### 2.7 操作上下文（$OpCtx$）
操作模式与行为的全局集合：  
$$OpCtx = (Schemas: \{OpSchema_i\}, Behaviors: \{OpBehavior_i\})$$

### 3. 管线
管线是由多阶段处理器构成的有向无环图（DAG），用于编排编辑器核心行为的执行流程。定义为：$Pipe=(Type,Handlers,Anchors,Edges,Event)$

其中：
* **处理器（$Handlers$）**：处理函数集合，满足 $Handlers \subseteq PipeCtx.Handlers$。
  * **名称（$Name$）**：阶段唯一标识。
  * **处理器（$Handlers$）**：处理函数集合，满足 $Handlers \subseteq PipeCtx.Handlers$。
  * **前置锚点（$PreAnchors$）**：声明本阶段依赖的锚点集合，需满足 $\forall a \in PreAnchors, a \in Edges$。
  * **后置锚点（$PostAnchors$）**：声明本阶段输出的锚点集合，用于连接后续阶段。
* **锚点（$Anchor$）**：阶段间的连接点，定义为：
  $$Anchor=(Name,Type)$$
  * **类型（$Type$）**  ：声明锚点语义类别（如数据注入点、校验点、副作用点等）。
* **边（$Edges$）**：阶段间的依赖关系集合，每条边可表示为：
  $$Edge=(FromStage,FromAnchor,ToStage,ToAnchor)$$

管线执行时，将拓扑排序阶段并按依赖顺序调用处理器。

#### 3.1 事件
事件是管线执行过程中的传递的信息，定义为：
$$Event=(Type,Data)$$
- **类型（$Type$）**：管线的名称。
- **数据（$Data$）**：事件携带的数据。

#### 3.2 管线上下文（$PipeCtx$）
管线上下文包含各管线信息，定义为：$$PipeCtx = \{Name_i: Pipe_i\}$$

### 4. 选区
选区是编辑器中用于标识和操作实体或实体范围的抽象概念。定义为：
$Selection=(Selected)$
其中：
- **选区（$Selected$）**：选区包含的实体集合。
### 5. 上下文（$Ctx$）
编辑器运行时环境定义为：  
$$Ctx = (Content, EntCtx, OpCtx, PipeCtx, History, Selection)$$ 

其中：
- **历史（$History$）**：操作序列 $H = [Op_1, Op_2, ..., Op_n]$，记录状态迁移过程。

### 6. 编辑
编辑即通过操作序列驱动状态迁移：  
$$S_0 \xrightarrow{Op_1} S_1 \xrightarrow{Op_2} ... \xrightarrow{Op_n} S_n$$  

### 7. 历史回溯  
- **撤销**：应用 $Op_n^{-1}$，回退至 $S_{n-1}$。  
- **重做**：重新应用预存操作，验证并迁移至新状态。