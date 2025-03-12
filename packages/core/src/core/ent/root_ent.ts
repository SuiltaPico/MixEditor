import { ChildEntCompo } from "../compo/child_ent";
import { ChildEntArrayCompo } from "../compo/child_ent_arr";
import { MixEditor } from "../mix_editor";

export function register_RootEnt(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_ent_behaviors("root", {
    init: async ({ it }) => {
      ecs.set_compos(it.id, [
        new ChildEntArrayCompo([]),
        new ChildEntCompo(ChildEntArrayCompo.type),
      ]);
    },
  });
}
