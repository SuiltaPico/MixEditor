import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { IChildEntityCompo } from "./child_ent";
import { CompoTDO, Ent, EntTDO } from "../../ecs";
import { MixEditor } from "../mix_editor";

/** 子实体组件。代表一个实体的子实体。 */
export class ChildEntArrayCompo implements IChildEntityCompo {
  static readonly type = "child_ent_array" as const;
  get type() {
    return ChildEntArrayCompo.type;
  }

  children: WrappedSignal<string[]>;

  // ----- 实现 IChildEntityCompo 接口 -----
  size() {
    return this.children.get().length;
  }
  at(index: number) {
    return this.children.get()[index];
  }

  constructor(children: string[]) {
    this.children = create_Signal(children, {
      equals: false,
    });
  }
}

export interface ChildEntArrayCompoTDO extends CompoTDO {
  children: string[];
}

export function register_ChildEntArrayCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ChildEntArrayCompo.type, {
    to_tdo: async ({ it }) => {
      return {
        type: ChildEntArrayCompo.type,
        children: it.children.get().map((child) => child),
      } satisfies ChildEntArrayCompoTDO;
    },
    from_tdo: async ({ input }) => {
      return new ChildEntArrayCompo((input as ChildEntArrayCompoTDO).children);
    },
  });
}
