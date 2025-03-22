import { Compo, CompoBehaviorMap } from "../../../ecs";
import { MixEditor, MECompoBehaviorHandler } from "../../mix_editor";

/** 创建组件。 */
export const CreateCb = "core:create" as const;

export interface BaseCompoBehaviorMap extends CompoBehaviorMap<MixEditor> {
  [CreateCb]: MECompoBehaviorHandler<{}, Compo>;
}
