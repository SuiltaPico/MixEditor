import { Document, MixEditor } from "@mixeditor/core";
import { Component, createSignal, For, onCleanup, onMount } from "solid-js";
import { NodeRendererManager } from "./NodeRendererManager";

export const DocumentRenderer: Component<{
  document: Document;
  editor: MixEditor;
}> = (props) => {
  onMount(() => {
    props.editor.event_manager.add_handler(".core:init", () => {
    
    });
  });

  return (
    <div class="document">
    </div>
  );
};
