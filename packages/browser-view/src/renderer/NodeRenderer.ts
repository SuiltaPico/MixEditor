import { MixEditor, MixEditorPluginContext, Node } from "@mixeditor/core";
import { Component } from "solid-js";
import { NodeRendererManager } from "./NodeRendererManager";

export type NodeRendererProps = {
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  node: Node;
};

export type NodeRenderer = Component<NodeRendererProps>;