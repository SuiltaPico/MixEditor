import { MEEntBehaviorHandler } from "@mixeditor/core";
import { Rendered, RenderedDomNode } from "./renderer/node_renderer";
import { BvContext } from "./context";
import {
  BvRenderSelectionContext,
  BvRenderSelectionDecision,
} from "./pipe/render_selection";

/** 扩展实体行为类型定义。 */
export interface EntBehaviorMapExtend {
  /** 获取节点渲染结果。
   *
   * 注意：不允许返回 Promise。 */
  "bv:renderer": MEEntBehaviorHandler<{ bv_ctx: BvContext }, Rendered>;
  /** 获取子节点的位置。 */
  "bv:get_child_caret": MEEntBehaviorHandler<
    {
      index: number;
    },
    { x: number; y: number; height: number } | undefined
  >;
  /** 绘制选区。 */
  "bv:handle_render_selection": MEEntBehaviorHandler<
    BvRenderSelectionContext,
    BvRenderSelectionDecision
  >;
}

/** 扩展实体域上下文类型定义。 */
export interface EntDomainCtxMapExtend {
  bv: {
    /** 实体在浏览器上对应的 DOM 节点。 */
    node: RenderedDomNode;
    /** 实体销毁函数。 */
    dispose: () => void;
  };
}
