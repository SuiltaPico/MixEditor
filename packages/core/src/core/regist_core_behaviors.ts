import { register_TransOp_behavior } from "../op/transaction";
import { MixEditor } from "./mix_editor";
import { register_core_pipes } from "./pipe";

export function regist_core_behaviors(core: MixEditor) {
  const { op } = core;
  register_TransOp_behavior(op);

  register_core_pipes(core);
}
