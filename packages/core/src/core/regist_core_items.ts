import { register_TransOp_behavior } from "../op/transaction";
import { MixEditor } from "./mix_editor";
import { register_core_ops } from "./op";
import { register_core_pipes } from "./pipe";

export function regist_core_items(core: MixEditor) {
  register_TransOp_behavior(core.op);
  register_core_pipes(core);
  register_core_ops(core);
}
