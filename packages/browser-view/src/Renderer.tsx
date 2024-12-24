import { Component, createSignal } from "solid-js";
import { DocumentRenderer } from "./DocumentRenderer";
import { MixEditor } from "@mixeditor/core";

export const Renderer: Component<{
  editor: MixEditor;
}> = (props) => {
  return (
    <div class="mix_editor">
      <DocumentRenderer document={props.editor.document} />
    </div>
  );
};
