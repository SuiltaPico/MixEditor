import { MixEditor, Node } from "@mixeditor/core";
import { Component, createContext, JSX, onMount, useContext } from "solid-js";
import { NodeRenderer } from "./NodeRenderer";
import { NodeRendererManager } from "./NodeRendererManager";

/** 文档渲染器的状态。 */
export class DocumentRendererState {
  /** 节点渲染器的缓存映射表。每次 NodeRendererWrapper 被调用，都会查询该表以确定是否使用缓存。 */
  node_renderer_map = new WeakMap<
    Node,
    { renderer: NodeRenderer; node: JSX.Element }
  >();

  get(node: Node) {
    return this.node_renderer_map.get(node);
  }

  set(node: Node, value: { renderer: NodeRenderer; node: JSX.Element }) {
    this.node_renderer_map.set(node, value);
  }
}

export const DocumentRendererContext = createContext<
  DocumentRendererState | undefined
>(undefined);

export const NodeRendererWrapper: Component<{
  node: Node;
  renderer_manager: NodeRendererManager;
  editor: MixEditor;
}> = (props) => {
  const doc_renderer_state = useContext(DocumentRendererContext);
  if (!doc_renderer_state) {
    throw new Error("DocumentRendererStateContext is not provided");
  }

  const cached = doc_renderer_state.get(props.node);
  const renderer = props.renderer_manager.get(props.node.type);

  if (cached && cached.renderer === renderer) {
    // 使用缓存节点，避免重复渲染。
    return cached.node;
  }

  // 使用节点渲染器渲染节点
  const node = renderer(props);

  // 将节点写入缓存
  doc_renderer_state.set(props.node, { renderer, node });

  return node;
};

export const DocumentRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
}> = (props) => {
  const doc_renderer_state = new DocumentRendererState();
  const document = props.editor.document;

  onMount(() => {
    props.editor.event_manager.add_handler(".core:init", () => {});
  });

  return (
    <DocumentRendererContext.Provider value={doc_renderer_state}>
      <div class="document">
        <NodeRendererWrapper
          node={document.root_node}
          renderer_manager={props.renderer_manager}
          editor={props.editor}
        />
      </div>
    </DocumentRendererContext.Provider>
  );
};
