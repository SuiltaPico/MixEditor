import { MixEditorPluginContext } from "@mixeditor/core";
import { Component } from "solid-js";
import { NodeRendererManager } from "./NodeRendererManager";

export type NodeRendererProps = {
  context: MixEditorPluginContext;
  renderer_manager: NodeRendererManager;
  node: Node;
};

export type NodeRenderer = Component<NodeRendererProps>;