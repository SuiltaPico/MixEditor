import { MixEditor } from "@mixeditor/core";
import { Renderer } from "../Renderer";

export function App() {
  const editor = new MixEditor({
    plugins: [],
  });
  
  return <Renderer editor={editor} />;
}
