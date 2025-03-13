import { ChildCompo } from "../compo/tree/child";
import { ArrayChildCompo } from "../compo/tree/child_ent_arr";
import { MixEditor } from "../mix_editor";

export function register_RootEnt(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_ent_behaviors("root", {
    init: async ({ it }) => {
      ecs.set_compos(it.id, [
        new ArrayChildCompo([]),
        new ChildCompo(ArrayChildCompo.type),
      ]);
    },
  });
}
