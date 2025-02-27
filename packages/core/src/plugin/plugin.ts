export interface PluginMeta {
  /** 插件名称 */
  name?: string;
  /** 插件描述 */
  description?: string;
  /** 插件作者 */
  author?: string | string[];
  /** 插件许可证 */
  license?: string | string[];
  /** 插件仓库地址 */
  repository?: string;
}

/** 插件接口定义 */
export interface Plugin<TExCtx = any> {
  /** 插件唯一标识 */
  id: string;
  /** 插件版本。符合 semver 规范。 */
  version: string;
  /** 插件元数据 */
  meta: PluginMeta;
  /** 插件依赖 */
  dependencies?: string[];
  /** 初始化函数 */
  init: (ctx: TExCtx) => any | Promise<any>;
  /** 销毁函数 */
  dispose: () => void | Promise<void>;
}
