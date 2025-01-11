import { NodeRenderer } from "@mixeditor/browser-view";
import { Node, TransferDataObject } from "@mixeditor/core";

export interface ParagraphNodeTDO extends TransferDataObject {
  data: {
    children: TransferDataObject[];
  };
}

export class ParagraphNode implements Node {
  type = "paragraph" as const;
  children: Node[];
  constructor(children: Node[]) {
    this.children = children;
  }
}

export const ParagraphRenderer: NodeRenderer<ParagraphNode> = (props) => {
  return (
    <p class="_paragraph">
      {props.node.children.map((child) => (
        <child.type />
      ))}
    </p>
  );
};
