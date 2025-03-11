import { create_PipeStage_chain, IPipeEvent } from "../../pipe";
import { create_RootEntTDO, RootEnt, RootEntTDO } from "../ent";
import { MixEditor } from "../mix_editor";

export interface LoadEvent extends IPipeEvent<MixEditor> {
  pipe_id: "load";
  input: RootEntTDO;
  output?: RootEnt;
}

export interface SaveEvent extends IPipeEvent<MixEditor> {
  pipe_id: "save";
  output?: RootEntTDO;
}

export function register_load_and_save_pipe(editor: MixEditor) {
  const { pipe, ecs: ent, ent_tdo, content } = editor;

  pipe.set_pipe(
    "load",
    create_PipeStage_chain([
      {
        id: "root_fix",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          if (!evt.input.type || evt.input.type !== "root") {
            evt.input = create_RootEntTDO({
              id: evt.input.id,
              children: evt.input.children,
            });
          }
        },
      },
      {
        id: "convert_tdo_to_ent",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.output = (await ent_tdo.exec_behavior(
            evt.input,
            "to_ent",
            {}
          )) as RootEnt;
        },
      },
      {
        id: "apply_output",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          content.root.set(evt.output as RootEnt);
        },
      },
    ])
  );

  pipe.set_pipe(
    "save",
    create_PipeStage_chain([
      {
        id: "load_from_content",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.output = (await ent.exec_behavior(
            content.root.get(),
            "to_tdo",
            {}
          )) as RootEntTDO;
        },
      },
    ])
  );
}
