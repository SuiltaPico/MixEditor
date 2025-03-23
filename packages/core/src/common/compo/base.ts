import { MixEditor } from "../../core";
import { Compo, GetCloneParamsCb } from "../../ecs";

/** 克隆组件。 */
export async function clone_compo(ecs: MixEditor["ecs"], compo: Compo) {
  const clone_params = await ecs.run_compo_behavior(
    compo,
    GetCloneParamsCb,
    {}
  );
  return await ecs.create_compo(compo.type, {
    params: clone_params,
  });
}

export type CustomDecisionFnParams<T> = {
  editor: MixEditor;
  ent_id: string;
} & T;
