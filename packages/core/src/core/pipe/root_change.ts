import { createEffect, on } from "solid-js";
import { IPipeEvent } from "../../pipe";
import { MixEditor } from "../mix_editor";

export const RootChangePipeID = "core:root_change";

export interface RootChangeEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof RootChangePipeID;
  old_ent: string | undefined;
  new_ent: string | undefined;
}

export function register_root_change_pipe(editor: MixEditor) {
  const { pipe, content } = editor;

  // === 生命周期管道 ===
  pipe.set_pipe(RootChangePipeID, []);

  createEffect(
    on(
      () => content.root.get(),
      (curr, prev) => {
        if (curr === prev) return;
        pipe.execute({
          pipe_id: RootChangePipeID,
          old_ent: prev,
          new_ent: curr,
        });
      }
    )
  );
}
