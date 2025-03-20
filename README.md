# MixEditor
MixEditor 是一个基于 ECS 架构的无头编辑器。其核心运作不于依赖 `contenteditable` 和 DOM。

## 路线图
### milestone 1
基础文档编辑。

- `@mixeditor/core@0.0.1`：提供编辑器的核心功能。
- `@mixeditor/document@0.0.1`：提供文档的抽象。
- `@mixeditor/browser-view@0.0.1`：提供编辑器的浏览器视图支持。
- `@mixeditor/doc-bv-bridge@0.0.1`：提供文档和浏览器视图的桥接。
- `@mixeditor/plugin-heading@0.0.1`：提供标题的插件。
- `@mixeditor/plugin-block-indent@1.0.0`：提供块缩进的插件。
- `@mixeditor/plugin-quote-block@0.0.1`: 引用块
- `@mixeditor/plugin-list@0.0.1`
- `@mixeditor/plugin-text-align@0.0.1`
- `@mixeditor/plugin-code@0.0.1`
- `@mixeditor/plugin-link@0.0.1`

### milestone 2
高级文档编辑。

- `@mixeditor/plugin-code@0.0.1`：代码高亮、代码类型选择
- `@mixeditor/plugin-toc@0.0.1`
- `@mixeditor/plugin-todo-list@0.0.1`
- `@mixeditor/plugin-table@0.0.1`
- `@mixeditor/plugin-diagram@0.0.1`
- `@mixeditor/plugin-latex-inline@0.0.1`：包含 block 和 inline。
- `@mixeditor/plugin-font@0.0.1`：包含 block 和 inline。
- `@mixeditor/plugin-image@0.0.1`：包含 block 和 inline。
- `@mixeditor/plugin-attachment@0.0.1`：包含 block 和 inline。
- `@mixeditor/plugin-stats@0.0.1`：包含 block 和 inline。

### milestone 3
协作、跨格式、跨平台支持。

- `@mixeditor/terminal-view@0.0.1`：提供编辑器的终端视图支持。
- `@mixeditor/browser-canvas-view@0.0.1`：提供编辑器的浏览器画布视图支持。
- `@mixeditor/code@0.0.1`：提供协作支持。
- `@mixeditor/collab@0.0.1`：提供协作支持。
- `@mixeditor/plugin-collab-comment@0.0.1`：提供评论支持。
- `@mixeditor/plugin-export-to-pdf@0.0.1`
- `@mixeditor/plugin-export-to-docx@0.0.1`
- `@mixeditor/plugin-markdown-doc@0.0.1`

### milestone 4
非文档编辑支持。

- `@mixeditor/mind-map@0.0.1`
- `@mixeditor/graph@0.0.1`
- `@mixeditor/3d-graph@0.0.1`
