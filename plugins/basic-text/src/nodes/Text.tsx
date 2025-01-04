import { NodeRenderer } from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import { Node } from "@mixeditor/core";

export class TextNode implements Node {
  type = "text" as const;
  text: WrappedSignal<string>;
  constructor(text: string) {
    this.text = createSignal(text);
  }
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  return <span class="_text">{props.node.text.get()}</span>;
};
