import { Document } from "@mixeditor/core";
import { NodeRenderer } from "./NodeRenderer";
import { NodeRendererWrapper } from "./ContentRenderer";

export const DocumentRenderer: NodeRenderer<Document> = (props) => {
  return (
    <div class="_document">
      {props.node.children.get().map((child) => {
        return (
          <NodeRendererWrapper
            node={child}
            renderer_manager={props.renderer_manager}
            editor={props.editor}
          />
        );
      })}
    </div>
  );
};
