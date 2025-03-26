import { BrowserViewPlugin } from "@mixeditor/browser-view";
import "@mixeditor/browser-view/index.css";
import "@mixeditor/doc-bv-bridge/index.css";
import {
  build_ent_specs,
  ent_spec,
  EntChildCompo,
  get_actual_child_compo,
  MixEditor,
  RootEntType,
  TextChildCompo,
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

setInterval(() => {
  console.log("tick", Date.now());
}, 8000);

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
    const print_tree = async (id: string): Promise<any> => {
      const ecs = editor.ecs;
      const ent = ecs.get_ent(id);
      const actual_child_compo = get_actual_child_compo(ecs, id);
      return {
        // id: ent?.id,
        type: ent?.type,
        compo: ecs.get_compos(id).keys(),
        children:
          actual_child_compo instanceof EntChildCompo
            ? await Promise.all(
                actual_child_compo.children.get().map(async (it) => {
                  return await print_tree(it);
                })
              )
            : actual_child_compo instanceof TextChildCompo
            ? actual_child_compo.content.get()
            : undefined,
      };
    };
    // @ts-ignore
    window.print_tree = print_tree;

    await editor.init({});

    console.time("build_ent_specs");
    const root = await build_ent_specs(
      editor,
      ent_spec(RootEntType, {
        children: array_repeat(
          () => [
            ent_spec(ParagraphEntType, {
              children: [
                // ent_spec(TextEntType, {
                //   content: "Hello, world!",
                // }),
              ],
            }),
          ],
          1
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
