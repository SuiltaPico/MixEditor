import { onMount } from "solid-js";
import "./App.css";
import { MixEditor } from "@mixeditor/core";
import { browser_view } from "@mixeditor/browser-view";

function App() {
  let editor_container: HTMLDivElement | null = null;

  onMount(() => {
    const editor = new MixEditor({
      plugins: [
        browser_view({
          element: editor_container!,
        }),
      ],
    });
    editor.init();
  });

  return (
    <>
      <div class="header_bar">Mixeditor 试验场</div>
      <main class="body">
        <div class="content">
          <div class="editor_container" ref={(it) => (editor_container = it)}></div>
        </div>
        <div class="sidebar"></div>
      </main>
    </>
  );
}

export default App;
