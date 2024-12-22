import { NodeRenderer } from "./NodeRenderer";

export class NodeRendererManager {
  private renderers: Map<string, NodeRenderer> = new Map();

  /** 注册一个节点渲染器 */
  public register(type: string, renderer: NodeRenderer) {
    this.renderers.set(type, renderer);
  }

  /** 注销一个节点渲染器 */
  public unregister(type: string) {
    this.renderers.delete(type);
  }

  /** 获取一个节点渲染器 */
  public get(type: string) {
    return this.renderers.get(type);
  }
}