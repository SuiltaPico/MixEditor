import { IPipeEvent } from "../../pipe";
import { MixEditor } from "../mix_editor";

export interface InitEvent extends IPipeEvent<MixEditor> {
  pipe_id: "init";
}
export interface DestroyEvent extends IPipeEvent<MixEditor> {
  pipe_id: "destroy";
}

export function register_life_cycle_pipe(editor: MixEditor) {
  const { pipe, plugin } = editor;

  // === 生命周期管道 ===
  pipe.set_pipe("init", [
    {
      id: "plugin_init",
      execute: async (evt) => {
        await plugin.init_plugins();
      },
    },
  ]);

  pipe.set_pipe("destroy", [
    {
      id: "plugin_destroy",
      execute: async (evt) => {
        await plugin.destroy(evt.ex_ctx);
      },
    },
  ]);
}
