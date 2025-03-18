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
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "SQL SELECT 语句简介",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "SQL（Structured Query Language，结构化查询语言）中的 ",
                }),
                ent_spec(
                  TextEntType,
                  {
                    text: "SELECT",
                  },
                  [new DocTextBoldCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 语句是用于从数据库中检索数据的最基本且最常用的命令。它允许用户从一张或多张数据库表中提取所需的数据，并支持对数据进行筛选、排序、分组和聚合等操作。",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "基本语法",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
                ent_spec(TextEntType, {
                  text: "SELECT column1, column2 FROM table_name WHERE condition;",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
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
                  [new DocTextBoldCompo()]
                ),
                ent_spec(TextEntType, {
                  text: " 表示选择所有列。",
                }),
              ],
            }),
            ent_spec(ParagraphEntType, {
              children: [
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
