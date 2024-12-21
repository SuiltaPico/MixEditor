import { MixEditorPluginContext } from "@mixeditor/core";
import { Component } from "solid-js";

export type NodeRenderer = Component<{
  context: MixEditorPluginContext;
  node: Node;
}>;
