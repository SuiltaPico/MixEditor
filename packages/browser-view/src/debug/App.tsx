import { MixEditor } from "@mixeditor/core";
import { browser_view } from "../plugin";

export function App() {
  const editor = new MixEditor({
    plugins: [browser_view({ element: document.querySelector("#root")! })],
  });
  editor.init();
}
