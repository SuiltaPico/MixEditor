import { onMount } from "solid-js";
import "./App.css";
import { MixEditor } from "@mixeditor/core";
import { browser_view } from "@mixeditor/browser-view";
import { text } from "@mixeditor/plugin-basic-text";

function App() {
  let editor_container: HTMLDivElement | null = null;

  onMount(async () => {
    const editor = new MixEditor({
      plugins: [
        browser_view({
          element: editor_container!,
        }),
        text(),
      ],
    });
    await editor.init();
    await editor.saver.load({
      type: "document",
      data: {
        schema_version: 1,
        created_at: new Date(),
        modified_at: new Date(),
        children: [
          {
            type: "text",
            data: {
              text: "Hello, World!",
            },
          },
        ],
      },
    });
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
