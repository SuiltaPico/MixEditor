import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { CompoTDO, Ent } from "../../ecs";
import { IParentEntityCompo } from "./parent_ent";
import { MixEditor } from "../mix_editor";

export class SingleParentEntCompo implements IParentEntityCompo {
  static readonly type = "single_parent_ent" as const;
  get type() {
    return SingleParentEntCompo.type;
  }

  parent: WrappedSignal<string | undefined>;

  // ----- 实现 IParentEntityCompo 接口 -----
  size() {
    return this.parent.get() ? 1 : 0;
  }
  at(_: number) {
    return this.parent.get();
  }

  constructor(parent: string | undefined) {
    this.parent = create_Signal(parent);
  }
}

export interface SingleParentEntCompoTDO extends CompoTDO {
  parent: string | undefined;
}

export function register_SingleParentEntCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(SingleParentEntCompo.type, {
    to_tdo: async ({ it }) => {
      return {
        type: SingleParentEntCompo.type,
        parent: it.parent.get(),
      } satisfies SingleParentEntCompoTDO;
    },
    from_tdo: async ({ input }) => {
      return new SingleParentEntCompo(
        (input as SingleParentEntCompoTDO).parent
      );
    },
  });
}
