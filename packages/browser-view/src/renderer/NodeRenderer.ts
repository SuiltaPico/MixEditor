import { MixEditor, Node } from "@mixeditor/core";
import { Component } from "solid-js";
import { NodeRendererManager } from "./NodeRendererManager";

export type NodeRendererProps<TNode extends Node = Node> = {
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
  node: TNode;
};

/** 节点渲染器。 */
export type NodeRenderer<TNode extends Node = Node> = Component<
  NodeRendererProps<TNode>
> & {
  /** 渲染器对应的节点。 */
  mixed_node?: TNode;
};

/** 带有 mixed_node 属性的组件。 */
export type WithMixEditorNode<T> = T & {
  mixed_node?: Node;
};
