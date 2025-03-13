import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { CompoTDO } from "../../../ecs";

/** 路由组件。用于记录路由的来源。 */
export class RouteCompo {
  src_compo_type: WrappedSignal<string>;

  constructor(source: string) {
    this.src_compo_type = create_Signal(source, {
      equals: false,
    });
  }
}

export interface RouteCompoTDO extends CompoTDO {
  source: string;
}