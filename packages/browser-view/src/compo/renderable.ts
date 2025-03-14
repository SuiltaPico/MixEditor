import { Compo, MECompoBehaviorMap } from "@mixeditor/core";
import { Rendered, RenderedFactory } from "../renderer/node_renderer";
import { BvRenderSelectionCb } from "../pipe/render_selection/compo_behavior";
import { BvRenderSelectionDecision } from "../pipe";

export enum RenderSelectionPolicy {
  /** 不绘制选区。 */
  None = "none",
  /** 自动绘制选区。 */
  Auto = "auto",
}

export class BvRenderableCompo implements Compo {
  static type = "bv:renderable" as const;
  get type() {
    return BvRenderableCompo.type;
  }

  render: RenderedFactory;
  rendered: Rendered | undefined;

  render_selection_policy: RenderSelectionPolicy | undefined;
  custom_render_selection:
    | ((
        params: Parameters<MECompoBehaviorMap[typeof BvRenderSelectionCb]>[0]
      ) => BvRenderSelectionDecision)
    | undefined;

  constructor(params: {
    render: RenderedFactory;
    render_selection_policy?: RenderSelectionPolicy;
    custom_render_selection?: BvRenderableCompo["custom_render_selection"];
  }) {
    this.render = params.render;
    this.render_selection_policy = params.render_selection_policy;
    this.custom_render_selection = params.custom_render_selection;
  }
}
