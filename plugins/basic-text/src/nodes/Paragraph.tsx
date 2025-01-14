import { NodeRenderer, WithMixEditorNode } from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import { AnyTDO, Node, TransferDataObject } from "@mixeditor/core";
import { onMount } from "solid-js";

export interface ParagraphNodeTDO extends TransferDataObject {
  type: "paragraph";
  children: AnyTDO[];
}

export class ParagraphNode implements Node {
  type = "paragraph" as const;
  children: WrappedSignal<Node[]>;
  constructor(children: Node[]) {
    this.children = createSignal(children);
  }
}

export const ParagraphRenderer: NodeRenderer<ParagraphNode> = (props) => {
  const { renderer_manager, node, editor } = props;

  let container!: WithMixEditorNode<HTMLParagraphElement>;
  onMount(() => {
    container.mixed_node = node;
  });

  return (
    <p class="_paragraph" ref={container}>
      {node.children.get().map((child) =>
        renderer_manager.get(child.type)({
          renderer_manager,
          node: child,
          editor,
        })
      )}
    </p>
  );
};
