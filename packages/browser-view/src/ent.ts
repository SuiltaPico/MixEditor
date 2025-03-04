import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import { JSX } from "solid-js";
import { BvContext } from "./context";

/** 扩展实体行为类型定义。 */
export interface EntBehaviorMapExtend {
  /** 获取节点渲染结果。 */
  "bv:renderer": MEEntBehaviorHandler<
    {},
    JSX.Element & {
      /** 渲染器对应的实体。 */
      me_ent?: Ent;
    }
  >;
  /** 获取子节点的位置。 */
  "bv:get_child_caret": MEEntBehaviorHandler<
    {
      index: number;
    },
    { x: number; y: number; height: number } | undefined
  >;
}

/** 扩展实体域上下文类型定义。 */
export interface EntDomainCtxMapExtend {
  bv: {
    /** 实体在浏览器上对应的 DOM 节点。 */
    node: HTMLElement;
  };
}
