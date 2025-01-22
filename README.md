# MixEditor
Headless 富文本编辑器。不依赖 `contenteditable` 和 DOM。

## 路线图
### milestone 1
基础文本编辑。

- `@mixeditor/core@1.0.0`：提供编辑器的核心功能。
- `@mixeditor/browser-view@1.0.0`：提供浏览器视图支持。
- `@mixeditor/plugin-basic-text@1.0.0`：提供基础文本编辑的插件，例如文本节点和段落节点。
- `@mixeditor/plugin-heading@1.0.0`：提供标题的插件。
- `@mixeditor/plugin-block-indent@1.0.0`：提供块缩进的插件。
- `@mixeditor/plugin-quote-block@1.0.0`: 引用块
- `@mixeditor/plugin-list@1.0.0`
- `@mixeditor/plugin-text-align@1.0.0`
- `@mixeditor/plugin-code@1.0.0`
- `@mixeditor/plugin-link@1.0.0`

### milestone 2
高级文本编辑。

- `@mixeditor/plugin-code@2.0.0`：代码高亮、代码类型选择
- `@mixeditor/plugin-toc@1.0.0`
- `@mixeditor/plugin-todo-list@1.0.0`
- `@mixeditor/plugin-table@1.0.0`
- `@mixeditor/plugin-diagram@1.0.0`
- `@mixeditor/plugin-latex@1.0.0`：包含 block 和 inline。
- `@mixeditor/plugin-font@1.0.0`：包含 block 和 inline。
- `@mixeditor/plugin-image@1.0.0`：包含 block 和 inline。
- `@mixeditor/plugin-attachment@1.0.0`：包含 block 和 inline。
- `@mixeditor/plugin-stats@1.0.0`：包含 block 和 inline。

### milestone 3
- `@mixeditor/plugin-co@1.0.0`
- `@mixeditor/plugin-co-comment@1.0.0`
- `@mixeditor/plugin-export-to-pdf@1.0.0`
- `@mixeditor/plugin-export-to-markdown@1.0.0`
