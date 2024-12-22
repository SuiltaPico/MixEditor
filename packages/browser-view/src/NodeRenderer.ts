import { MixEditorPluginContext } from "@mixeditor/core";
import { Component } from "solid-js";

export type NodeRendererProps = {
  context: MixEditorPluginContext;
  node: Node;
};

export type NodeRenderer = Component<NodeRendererProps>;
