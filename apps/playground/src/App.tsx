import { onMount } from "solid-js";
import { create_DocumentTDO, MixEditor } from "@mixeditor/core";
import { browser_view } from "@mixeditor/browser-view";
import { paragraph, text } from "@mixeditor/plugin-basic-text";
import "./App.css";
import "@mixeditor/browser-view/index.css";

function array_repeat<T>(arr: T[], count: number) {
  return Array.from({ length: count }, () => arr).flat();
}

function App() {
  let editor_container: HTMLDivElement | null = null;

  onMount(async () => {
    const editor = new MixEditor({
      plugins: [
        browser_view({
          element: editor_container!,
        }),
        text(),
        paragraph(),
      ],
    });
    await editor.init();
    await editor.saver.load(
      create_DocumentTDO({
        children: array_repeat(
          [
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  content:
                    "富文本编辑器是一种允许用户以所见即所得（WYSIWYG）的方式创建和编辑文本的工具。与纯文本编辑器不同，富文本编辑器允许用户对文本进行格式化，例如更改字体、字号、颜色，以及添加粗体、斜体、下划线等样式。",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  content:
                    "这种编辑器通常被用于需要丰富内容呈现的场景，例如博客文章、电子邮件、在线文档编辑等。用户可以像使用文字处理软件一样，直观地编辑文本内容，而无需了解 HTML 等标记语言。",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  content:
                    "富文本编辑器通过将用户的格式化操作转换成相应的代码来实现富文本效果。当用户保存或发布内容时，这些代码会被解析并渲染成最终的视觉效果。",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  content:
                    "常见的富文本编辑器功能包括段落格式化、字符格式化、插入链接和图片等。通过这些功能，用户可以轻松地创建出具有良好可读性和视觉吸引力的内容。",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  content:
                    "富文本编辑器通过将用户的格式化操作转换成相应的代码来实现富文本效果。当用户保存或发布内容时，这些代码会被解析并渲染成最终的视觉效果。",
                },
              ],
            },
          ],
          100
        ),
      })
    );
  });

  return (
    <>
      <div class="_header_bar">MixEditor 试验场</div>
      <main class="_body">
        <div class="sidebar"></div>
        <div class="_content">
          <div
            class="_editor_container"
            ref={(it) => (editor_container = it)}
          ></div>
        </div>
      </main>
    </>
  );
}

export default App;
