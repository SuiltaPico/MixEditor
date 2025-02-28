import { Plugin } from "./plugin";

/** 插件未找到错误 */
export class PluginNotFoundError extends Error {
  constructor(pluginId: string) {
    super(`插件 ${pluginId} 未找到`);
  }
}

/** 插件状态类型 */
export type PluginManagerState =
  | { type: "uninited" }
  | {
      type: "not_fully_inited";
      failed_plugins: string[];
      new_plugins: string[];
    }
  | { type: "inited" };

/** 插件数据结构 */
type PluginData<TPlugin> = {
  inited: boolean;
  plugin: TPlugin;
  pwr: PromiseWithResolvers<void>;
  exposed: any;
};

/** 创建一个 PromiseWithResolvers */
function create_pwr() {
  const pwr = Promise.withResolvers<void>();
  // 防止 nodejs 的 unhandledRejection导致进程退出
  pwr.promise.catch(() => {});
  return pwr;
}

/** 插件管理器 */
export class PluginCtx<
  TExCtx = any,
  TPlugin extends Plugin<TExCtx> = Plugin<TExCtx>
> {
  private ex_ctx: TExCtx;
  private plugins: Map<string, PluginData<TPlugin>> = new Map();
  private state: PluginManagerState = { type: "uninited" };

  /** 处理插件初始化成功 */
  private resolve_plugin_pwr(id: string, exposed: any): void {
    const pluginData = this.plugins.get(id)!;

    pluginData.inited = true;
    pluginData.exposed = exposed;
    pluginData.pwr.resolve(undefined);
  }

  /** 处理插件初始化失败 */
  private reject_plugin_pwr(id: string, err: unknown): void {
    const pluginData = this.plugins.get(id)!;

    pluginData.pwr.reject(err);
    this.plugins.set(id, {
      inited: false,
      plugin: pluginData.plugin,
      pwr: create_pwr(),
      exposed: undefined,
    });
  }

  /** 注册插件 */
  register(plugin: TPlugin): void {
    this.plugins.set(plugin.id, {
      inited: false,
      plugin,
      pwr: create_pwr(),
      exposed: undefined,
    });

    if (this.state.type === "inited") {
      this.state = {
        type: "not_fully_inited",
        failed_plugins: [],
        new_plugins: [plugin.id],
      };
    } else if (this.state.type === "not_fully_inited") {
      this.state.new_plugins.push(plugin.id);
    }
  }

  /** 注销插件 */
  async unregister(id: string): Promise<void> {
    const pluginData = this.plugins.get(id);
    if (!pluginData) throw new PluginNotFoundError(id);

    await pluginData.plugin.dispose();
    this.plugins.delete(id);

    if (this.state.type === "not_fully_inited") {
      const { new_plugins: newPlugins, failed_plugins: failedPlugins } =
        this.state;
      this.state.new_plugins = newPlugins.filter((pid) => pid !== id);
      this.state.failed_plugins = failedPlugins.filter((pid) => pid !== id);

      if (!this.state.new_plugins.length && !this.state.failed_plugins.length) {
        this.state = { type: "inited" };
      }
    }
  }

  /** 等待插件初始化完成 */
  async wait_plugin_inited<TExposed>(id: string): Promise<TExposed> {
    const pluginData = this.plugins.get(id);
    if (!pluginData) throw new PluginNotFoundError(id);
    if (pluginData.inited) return pluginData.exposed as TExposed;
    await pluginData.pwr.promise;
    return pluginData.exposed as TExposed;
  }

  /** 等待插件初始化完成 */
  async wait_plugins_inited<TExposed extends any[]>(
    ids: string[]
  ): Promise<TExposed> {
    return (await Promise.all(
      ids.map((id) => this.wait_plugin_inited(id))
    )) as TExposed;
  }

  /** 初始化所有已注册的插件 */
  async init_plugins() {
    const initResults = await Promise.allSettled(
      Array.from(this.plugins.values()).map(async (pluginData) => {
        // 跳过已初始化插件
        if (pluginData.inited) return;
        try {
          const result = await Promise.resolve(
            await pluginData.plugin.init(this.ex_ctx)
          );
          this.resolve_plugin_pwr(pluginData.plugin.id, result);
          return [pluginData, result];
        } catch (err) {
          this.reject_plugin_pwr(pluginData.plugin.id, err);
          throw [pluginData, err];
        }
      })
    );

    const result = {
      success: initResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<[PluginData<TPlugin>, any]> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value),
      failed: initResults
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) => result.reason),
    };

    if (result.failed.length) {
      this.state = {
        type: "not_fully_inited",
        failed_plugins: result.failed.map(
          ([pluginData]) => pluginData.plugin.id
        ),
        new_plugins: [],
      };
    } else {
      this.state = { type: "inited" };
    }

    return result;
  }

  /** 销毁所有已注册的插件 */
  async destroy() {
    await Promise.all(
      Array.from(this.plugins.values()).map(async (pluginData) => {
        await pluginData.plugin.dispose();
      })
    );
  }

  constructor(ex_ctx: TExCtx) {
    this.ex_ctx = ex_ctx;
  }
}
