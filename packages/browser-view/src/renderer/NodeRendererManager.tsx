import { EmitterSignal } from "@mixeditor/common";
import { NodeRenderer } from "./NodeRenderer";

export class NodeRendererManager {
  private renderers: Map<string, NodeRenderer> = new Map();
  private reload_renderer_signal = new EmitterSignal();
  private default_renderer: NodeRenderer = () => <div>节点未被渲染</div>;

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
    return this.renderers.get(type) || this.default_renderer;
  }

  /** 重新加载节点渲染器 */
  public reload() {
    this.reload_renderer_signal.emit();
  }

  /** 监听节点渲染器重新加载 */
  public use_reload_signal() {
    return this.reload_renderer_signal.use();
  }
}
