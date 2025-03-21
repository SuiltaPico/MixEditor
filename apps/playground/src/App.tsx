import { BrowserViewPlugin } from "@mixeditor/browser-view";
import "@mixeditor/browser-view/index.css";
import "@mixeditor/doc-bv-bridge/index.css";
import {
  build_ent_specs,
  ent_spec,
  MixEditor,
  RootEntType,
} from "@mixeditor/core";
import {
  CodeBlockEntType,
  DocCodeInlineCompo,
  DocHeadingCompo,
  DocLinkCompo,
  DocTextBoldCompo,
  DocumentPlugin,
  ParagraphEntType,
  TextEntType,
} from "@mixeditor/document";
import { DocBvBridgePlugin } from "@mixeditor/doc-bv-bridge";
import { onMount } from "solid-js";
import "./App.css";

function array_repeat<T>(arr: () => T[], count: number) {
  return Array.from({ length: count }, () => arr()).flat();
}

function App() {
  let editor_container: HTMLDivElement | null = null;

  onMount(async () => {
    const editor = new MixEditor({
      plugins: [
        DocumentPlugin(),
        BrowserViewPlugin({
          mount_to: editor_container!,
        }),
        DocBvBridgePlugin(),
      ],
    });
    // @ts-ignore
    window.editor = editor;
    await editor.init({});

    console.time("build_ent_specs");
    const root = await build_ent_specs(
      editor,
      ent_spec(RootEntType, {
        children: array_repeat(
          () => [
            ent_spec(
              ParagraphEntType,
              {
                children: [
                  ent_spec(TextEntType, {
                    text: "深入理解 SQL SELECT 语句",
                  }),
                ],
              },
              [new DocHeadingCompo(1)]
            ),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "SQL（Structured Query Language）是用于管理和操作关系型数据库的标准语言。在 SQL 中，",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "SELECT",
                  },
                  [new DocCodeInlineCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 句是最常用且功能强大的命令之一。它允许我们从数据库中检索数据，并根据需要进行过滤、排序和分组。本文将详细介绍 ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "SELECT",
                  },
                  [new DocCodeInlineCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 语句的语法、用法以及一些高级特性。",
                }),
              ],
            }),
            ent_spec(
              ParagraphEntType,
              {
                children: [
                  ent_spec(TextEntType, {
                    text: "基本语法",
                  }),
                ],
              },
              [new DocHeadingCompo(2)]
            ),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(
                  TextEntType,
                  {
                    text: "SELECT",
                  },
                  [new DocCodeInlineCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 语句的基本语法如下：",
                }),
              ],
            }),
            ent_spec(CodeBlockEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "SELECT column1, column2, ...\nFROM table_name\nWHERE condition",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "● ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "SELECT：",
                  },
                  [new DocTextBoldCompo()]
                ),
                ent_spec(TextEntType, {
                  text: "指定要检索的列。可以使用 ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "*",
                  },
                  [new DocCodeInlineCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 表示选择所有列。",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "● ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "FROM：",
                  },
                  [new DocTextBoldCompo()]
                ),
                ent_spec(TextEntType, {
                  text: "指定要从中检索数据的表。",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "● ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "WHERE：",
                  },
                  [new DocTextBoldCompo()]
                ),
                ent_spec(TextEntType, {
                  text: "​（可选）：用于指定筛选条件，只有满足条件的行才会被返回。",
                }),
              ],
            }),
            ent_spec(
              ParagraphEntType,
              {
                children: [
                  ent_spec(TextEntType, {
                    text: "参考资料",
                  }),
                ],
              },
              [new DocHeadingCompo(2)]
            ),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "● ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "SQL 教程",
                  },
                  [new DocLinkCompo("https://www.w3schools.com/sql/")]
                ),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "● ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "MySQL 官方文档",
                  },
                  [new DocLinkCompo("https://dev.mysql.com/doc/")]
                ),
              ],
            }),
          ],
          5
        ),
      })
    );
    console.timeEnd("build_ent_specs");

    editor.content.root.set(root);

    console.log(editor);
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
