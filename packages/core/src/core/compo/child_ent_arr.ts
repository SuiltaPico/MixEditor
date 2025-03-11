import { create_Signal } from "@mixeditor/common";
import { IChildEntityCompo } from "./child_ent";
import { Ent } from "../../ecs";

/** 子实体组件。代表一个实体的子实体。 */
export class ChildEntArrayCompo implements IChildEntityCompo {
  static readonly type = "child_ent_array" as const;
  get type() {
    return ChildEntArrayCompo.type;
  }

  children = create_Signal<Ent[]>([]);

  length() {
    return this.children.get().length;
  }
  at(index: number) {
    return this.children.get()[index];
  }
}
