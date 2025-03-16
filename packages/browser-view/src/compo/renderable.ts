import {
  Compo,
  CustomDecisionFnParams,
  MECompoBehaviorMap,
  MixEditor,
} from "@mixeditor/core";
import { RenderResult, Renderer } from "../common/render";
import { MaybePromise, Rect } from "@mixeditor/common";

/** 选区绘制决策。 */
export const BvRenderSelectionDecision = {
  /** 跳过，不绘制选区。
   * @default
   */
  Ignore: {
    type: "ignore",
  },
  /** 进入自己的逐个子节点。 */
  Traverse: {
    type: "traverse",
  },
  /** 自定义选区绘制。（直接在当前节点绘制选区） */
  DrawRect: (rects: Rect[]) => ({
    type: "draw_rect" as const,
    /** 选区范围。 */
    rects,
  }),
} as const;

/** 选区绘制决策。 */
export type BvRenderSelectionDecision =
  | {
      type: "ignore";
    }
  | {
      type: "traverse";
    }
  | {
      type: "draw_rect";
      rects: Rect[];
    };

/** 定义可渲染组件的参数接口 */
export interface BvRenderableParams {
  /** 渲染函数 */
  renderer: BvRenderableCompo["renderer"];

  /** 自定义位置获取函数（可选） */
  custom_get_child_pos?: BvRenderableCompo["custom_get_child_pos"];

  /** 选区渲染策略（可选） */
  render_selection_policy?: BvRenderableCompo["render_selection_policy"];
  /** 自定义选区渲染函数（可选） */
  custom_render_selection?: BvRenderableCompo["custom_render_selection"];
}

/** 浏览器视图可渲染组件
 *
 * 负责处理元素的渲染和选区绘制。
 */
export class BvRenderableCompo implements Compo {
  static readonly type = "bv:renderable" as const;

  get type() {
    return BvRenderableCompo.type;
  }

  /** 渲染函数 */
  renderer: Renderer;
  /** 渲染结果（可能未定义） */
  render_result: RenderResult | undefined;

  custom_get_child_pos:
    | ((params: CustomDecisionFnParams<{ index: number }>) =>
        | {
            x: number;
            y: number;
            height: number;
          }
        | undefined)
    | undefined;

  /** 选区渲染策略 */
  render_selection_policy: BvRenderSelectionDecision;
  /** 自定义的选区渲染决策函数 */
  custom_render_selection?: (
    params: CustomDecisionFnParams<{
      from: number;
      to: number;
    }>
  ) => MaybePromise<BvRenderSelectionDecision>;

  get_child_pos(
    params: Parameters<
      Exclude<BvRenderableCompo["custom_get_child_pos"], undefined>
    >[0]
  ) {
    return this.custom_get_child_pos?.(params);
  }

  /** 获取选区渲染策略 */
  async get_render_selection_policy(
    params: Parameters<
      Exclude<BvRenderableCompo["custom_render_selection"], undefined>
    >[0]
  ): Promise<BvRenderSelectionDecision> {
    if (this.custom_render_selection) {
      return await this.custom_render_selection(params);
    }
    return this.render_selection_policy;
  }

  constructor(params: BvRenderableParams) {
    this.renderer = params.renderer;
    this.render_selection_policy =
      params.render_selection_policy ?? BvRenderSelectionDecision.Ignore;
    this.custom_get_child_pos = params.custom_get_child_pos;
    this.custom_render_selection = params.custom_render_selection;
  }
}
