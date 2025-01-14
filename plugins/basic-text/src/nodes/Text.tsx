import { NodeRenderer, WithMixEditorNode } from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import { Node, TransferDataObject } from "@mixeditor/core";
import { onMount } from "solid-js";

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
}

export class TextNode implements Node {
  type = "text" as const;
  text: WrappedSignal<string>;
  constructor(text: string) {
    this.text = createSignal(text);
  }
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  const { node } = props;

  let container!: WithMixEditorNode<HTMLElement>;
  onMount(() => {
    container.mixed_node = node;
  });

  return (
    <span class="_text" ref={container}>
      {node.text.get()}
    </span>
  );
};
