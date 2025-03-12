import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { Compo, CompoTDO, Ent } from "../../ecs";
import { MixEditor } from "../mix_editor";
import { RouteCompo } from "./basic/route";
import { IArrayLike } from "../../common/object";

/** 子实体组件。不提供子实体的记录，仅记录子实体的来源。 */
export class ChildEntCompo extends RouteCompo {
  static readonly type = "child_ent" as const;
  get type() {
    return ChildEntCompo.type;
  }
}

export interface ChildEntCompoTDO extends CompoTDO {
  source: string;
}

export function register_ChildEntCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ChildEntCompo.type, {
    to_tdo: async ({ it }) => {
      const from = it.source.get();
      return {
        type: ChildEntCompo.type,
        from,
      };
    },
    from_tdo: async ({ input }) => {
      return new ChildEntCompo((input as ChildEntCompoTDO).source);
    },
  });
}

/** 子实体组件的接口。若满足此接口，则可以作为子实体的 source 使用。 */
export type IChildEntityCompo = IArrayLike<string>;
