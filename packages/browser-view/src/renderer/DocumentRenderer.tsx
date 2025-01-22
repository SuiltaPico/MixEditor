import { DocumentNode } from "@mixeditor/core";
import { NodeRenderer } from "./NodeRenderer";
import { NodeRendererWrapper } from "./ContentRenderer";

/** 文档渲染器。
 * 负责渲染文档节点。
 */
export const DocumentRenderer: NodeRenderer<DocumentNode> = (props) => {
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
