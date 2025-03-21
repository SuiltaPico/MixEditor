import { register_TransOp_behavior } from "./op/transaction";
import { register_compos } from "./compo";
import { register_ents } from "./ent";
import { MixEditor } from "./mix_editor";
import { register_ops } from "./op";
import { register_pipes } from "./pipe";

export function regist_core_items(core: MixEditor) {
  register_TransOp_behavior(core.op);
  register_pipes(core);
  register_ops(core);
  register_ents(core);
  register_compos(core);
}
