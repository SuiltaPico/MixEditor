import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { Compo, CompoTDO } from "./compo";
import { TDO } from "../tdo";

/** 实体。编辑器的最小内容单元。 */
export class Ent<TCompoMap extends Record<string, Compo>> {
  /** 实体的组合。 */
  compos: WrappedSignal<Map<string, Compo>> = create_Signal<Map<string, Compo>>(
    new Map()
  );

  set_compos(comps: Map<string, Compo>) {
    this.compos.set(comps);
  }

  add_compo(compo: Compo) {
    const comps = this.compos.get();
    comps.set(compo.get_type(), compo);
    // 触发信号更新
    this.compos.set(comps);
  }

  get_compo<TType extends Extract<keyof TCompoMap, string>>(
    type: TType
  ): TCompoMap[TType] | undefined {
    return this.compos.get().get(type) as TCompoMap[TType] | undefined;
  }

  get_compos() {
    return this.compos.get();
  }

  constructor(public id: string, public type: string) {}
}

/** 实体数据传输对象。 */
export interface EntTDO extends TDO {
  id: string;
  type: string;
  compos: Record<string, CompoTDO>;
}
