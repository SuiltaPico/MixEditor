import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { CompoDTO } from "../../../ecs";

/** 路由组件。用于记录路由的来源。 */
export class RouteCompo {
  src: WrappedSignal<string>;

  constructor(source: string) {
    this.src = create_Signal(source, {
      equals: false,
    });
  }
}

export interface RouteCompoDTO extends CompoDTO {
  src: string;
}
