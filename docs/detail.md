# 从本质出发
## 核心拓展（`@mixeditor/*-core`）
### 文档核心（`@mixeditor/doc-core`）
#### 文档内容
文档的实体间构成树形关系。定义实体行为：
```ts
interface EntBehavior {
  // --- 读 ---
  get_tree_length: EntBehaviorHandler<{}, number>;
  get_tree_child: EntBehaviorHandler<{
    index: number;
  }, ID>;
  get_tree_children: EntBehaviorHandler<{}, ID[]>;
  get_tree_index_of: EntBehaviorHandler<{
    id: ID;
  }, number>;
  // --- 写 ---
  insert_tree_children: EntBehaviorHandler<{
    to: number;
    children: ID[];
  }, void>;
  remove_tree_children: EntBehaviorHandler<{
    from: number;
    to: number;
  }, void>;
}
```



### 树状历史（`@mixeditor/tree-history-core`）
（类似 Git 的树状历史）

## 视图（`@mixeditor/*-view`）
### 双向映射  
1. **输出映射**：将 $Content$ 转换为用户可感知的界面（如文本、图形）。  
2. **输入映射**：将用户交互事件转换为操作 $Op$，触发状态迁移。

### 单向数据流
用户输入产生事件，事件处理器产生原始 $\Delta$，$\Delta$ 被验证后，执行器执行 $\Delta$ 并生成新的状态，并记录 $\Delta$ 至 History。然后视图层对新状态进行渲染。

数学描述为：
$$
\begin{CD}
UserInput @>event>> Op @>apply>> (S', \Delta_{inv}) @>record>> History \\
@. @. @VVrenderV \\
@. @. View'
\end{CD}
$$

### 浏览器视图（`@mixeditor/browser-view`）


## 协作（`@mixeditor/*-collab`）
### Yjs 协作适配（`@mixeditor/yjs-collab`）
