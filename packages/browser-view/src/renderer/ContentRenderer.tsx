import { MixEditor, Node } from "@mixeditor/core";
import { Component, createContext, JSX, onMount, useContext } from "solid-js";
import { NodeRenderer } from "./NodeRenderer";
import { NodeRendererManager } from "./NodeRendererManager";

/** 文档渲染器的状态。 */
export class ContentRendererState {
  /** 节点渲染器的缓存映射表。每次 NodeRendererWrapper 被调用，都会查询该表以确定是否使用缓存。 */
  node_renderer_map = new WeakMap<
    Node,
    { renderer: NodeRenderer; rendered: JSX.Element }
  >();

  get(node: Node) {
    return this.node_renderer_map.get(node);
  }

  set(node: Node, value: { renderer: NodeRenderer; rendered: JSX.Element }) {
    this.node_renderer_map.set(node, value);
  }
}

/** 内容渲染器上下文。
 * 提供内容渲染器相关的功能。
 */
export const ContentRendererContext = createContext<
  ContentRendererState | undefined
>(undefined);

export const NodeRendererWrapper: Component<{
  node: Node;
  renderer_manager: NodeRendererManager;
  editor: MixEditor;
}> = (props) => {
  const doc_renderer_state = useContext(ContentRendererContext);
  if (!doc_renderer_state) {
    throw new Error("ContentRendererContext is not provided");
  }

  const cached = doc_renderer_state.get(props.node);
  const renderer = props.renderer_manager.get(props.node.type);

  if (cached && cached.renderer === renderer) {
    // 使用缓存节点，避免重复渲染。
    return cached.rendered;
  }

  // 使用节点渲染器渲染节点
  const rendered = renderer(props);

  // 将节点写入缓存
  doc_renderer_state.set(props.node, { renderer, rendered });

  return rendered;
};

export const ContentRenderer: Component<{
  editor: MixEditor;
  renderer_manager: NodeRendererManager;
}> = (props) => {
  const doc_renderer_state = new ContentRendererState();
  const document = props.editor.document;

  onMount(() => {
    props.editor.event_manager.add_handler("init", () => {});
  });

  return (
    <ContentRendererContext.Provider value={doc_renderer_state}>
      <NodeRendererWrapper
        node={document.get()}
        renderer_manager={props.renderer_manager}
        editor={props.editor}
      />
    </ContentRendererContext.Provider>
  );
};
