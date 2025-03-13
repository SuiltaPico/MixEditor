import { init_pipe_of } from "../../common/ent";
import { EntInitBehavior, GetEntBehaviorHandlerParams } from "../../ecs";
import { ArrayChildCompo } from "../compo/tree/arr_child";
import { ChildCompo } from "../compo/tree/child";
import { MEEntBehaviorMap, MixEditor } from "../mix_editor";

export const RootEntType = "root";
export const RootEntInitPipe = init_pipe_of("", RootEntType);

export type RootEntInitPipeEvent = GetEntBehaviorHandlerParams<
  MEEntBehaviorMap["init"]
> & { pipe_id: typeof RootEntInitPipe };

const core_init_stage = {
  id: "core_init",
  execute: async (
    event: RootEntInitPipeEvent,
    wait_deps: () => Promise<void>
  ) => {
    await wait_deps();
    const ent = event.it;
    const ecs = event.ex_ctx.ecs;
    ecs.set_compos(ent.id, [
      new ArrayChildCompo([]),
      new ChildCompo(ArrayChildCompo.type),
    ]);
  },
};

export function register_RootEnt(editor: MixEditor) {
  const { ecs, pipe } = editor;
  pipe.set_pipe(RootEntInitPipe, [core_init_stage]);
  ecs.set_ent_behaviors(RootEntType, {
    async [EntInitBehavior]({ it }) {
      await pipe.execute({
        pipe_id: RootEntInitPipe,
        it,
        ex_ctx: editor,
      });
    },
  });

  return () => {
    pipe.delete_pipe(RootEntInitPipe);
  };
}
