import { NodeRenderer } from "@mixeditor/browser-view";
import { WrappedSignal } from "@mixeditor/common";
import { Node } from "@mixeditor/core";

export interface TextNode extends Node {
  node_type: "text";
  text: WrappedSignal<string>;
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  return <span class="_text">{props.node.text.get()}</span>;
};
