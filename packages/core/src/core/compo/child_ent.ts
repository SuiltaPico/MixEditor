import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { Compo, Ent } from "../../ecs";

/** 子实体组件。代表一个实体的子实体。 */
export class ChildEntCompo implements Compo {
  static readonly type = "child_ent" as const;
  from = create_Signal<string | undefined>(undefined);
  get type() {
    return ChildEntCompo.type;
  }
}

export interface IChildEntityCompo extends Compo {
  length: () => number;
  at(index: number): Ent | undefined;
}
