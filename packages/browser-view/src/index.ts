import { MaybePromise } from "@mixeditor/common";
import {
  BvPointerDownEvent,
  BvPointerEventHandlerName,
  BvPointerMoveEvent,
  BvPointerUpEvent,
  PointerEventHandler,
} from "./respo_chain/Pointer";
import { MixEditor } from "@mixeditor/core";
import { BvKeyDownEvent } from "./respo_chain/Key";
import { SelectedMaskResult } from "./respo_chain/Selection";
export * from "./respo_chain/Pointer";
export * from "./respo_chain/Selection";
export * from "./plugin";
export * from "./renderer/EditorRenderer";
export * from "./renderer/NodeRenderer";
export * from "./renderer/NodeRendererManager";
export * from "./common/dom";

// 扩展主模块
declare module "@mixeditor/core" {
  interface Events {
    "bv:pointer_down": BvPointerDownEvent;
    "bv:pointer_up": BvPointerUpEvent;
    "bv:pointer_move": BvPointerMoveEvent;
    "bv:key_down": BvKeyDownEvent;
  }

  interface NodeHandlerMap
    extends Record<BvPointerEventHandlerName, PointerEventHandler> {
    /** 获取子节点的位置。 */
    "bv:get_child_pos": (
      context: MixEditor,
      node: Node,
      child_index: number
    ) => MaybePromise<{ x: number; y: number } | undefined>;
    /** 处理如何绘制选区遮罩层。 */
    "bv:handle_selected_mask": (
      context: MixEditor,
      node: Node,
      from: number,
      to: number
    ) => MaybePromise<SelectedMaskResult>;
  }

  interface NodeContext {
    /** 对应的 HTML 节点。 */
    "bv:html_node"?: HTMLElement;
  }
}
