import { createEffect } from "solid-js";
import { IPipeEvent } from "../../pipe";
import { MixEditor } from "../mix_editor";

export const RootChangePipeID = "core:root_change";

export interface RootChangeEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof RootChangePipeID;
}

export function register_root_change_pipe(editor: MixEditor) {
  const { pipe, content } = editor;

  // === 生命周期管道 ===
  pipe.set_pipe(RootChangePipeID, []);

  createEffect(() => {
    content.root.get();
    pipe.execute({ pipe_id: RootChangePipeID });
  });
}
