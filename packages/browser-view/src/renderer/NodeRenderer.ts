import { MixEditor, Node } from "@mixeditor/core";
import { Component } from "solid-js";
import { NodeRendererManager } from "./NodeRendererManager";

export type NodeRendererProps<TNode extends Node = Node> = {
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  node: TNode;
};

export type NodeRenderer<TNode extends Node = Node> = Component<
  NodeRendererProps<TNode>
>;
