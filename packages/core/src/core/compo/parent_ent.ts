import { IArrayLike } from "../../common/object";
import { CompoTDO, Ent } from "../../ecs";
import { MixEditor } from "../mix_editor";
import { RouteCompo } from "./basic/route";

export class ParentEntCompo extends RouteCompo {
  static readonly type = "parent_ent" as const;
  get type() {
    return ParentEntCompo.type;
  }
}

export interface ParentEntCompoTDO extends CompoTDO {
  source: string;
}

export function register_ParentEntCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(ParentEntCompo.type, {
    to_tdo: async ({ it }) => {
      return {
        type: ParentEntCompo.type,
        source: it.source.get(),
      } satisfies ParentEntCompoTDO;
    },
    from_tdo: async ({ input }) => {
      return new ParentEntCompo((input as ParentEntCompoTDO).source);
    },
  });
}

/** 父实体组件的接口。若满足此接口，则可以作为父实体的 source 使用。 */
export type IParentEntityCompo = IArrayLike<string>;
