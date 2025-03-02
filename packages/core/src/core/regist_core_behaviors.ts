import { Ent } from "../ent";
import { EntTDO } from "../ent/tdo/tdo";
import { register_TransOp_behavior } from "../op/transaction";
import { create_PipeStage_chain, IPipeEvent, Pipe } from "../pipe";
import { TDO } from "../tdo";
import {
  create_RootEnt,
  create_RootEntTDO,
  RootEnt,
  RootEntTDO,
} from "./ent/root_ent";
import { MEEntMap, MixEditor } from "./MixEditor";

export interface InitEvent extends IPipeEvent<MixEditor> {
  pipe_id: "init";
}
export interface DestroyEvent extends IPipeEvent<MixEditor> {
  pipe_id: "destroy";
}

export interface LoadTdoToContentEvent extends IPipeEvent<MixEditor> {
  pipe_id: "load_tdo_to_content";
  input: RootEntTDO;
  output?: RootEnt;
}
export interface SaveContentToTdoEvent extends IPipeEvent<MixEditor> {
  pipe_id: "save_content_to_tdo";
  input: RootEnt;
  output?: TDO;
}
export interface LoadSerializedToContentEvent extends IPipeEvent<MixEditor> {
  pipe_id: "load_serialized_to_content";
  input: any;
  format: string;
  config: any;
  output: RootEntTDO;
}
export interface SaveContentToSerializedEvent extends IPipeEvent<MixEditor> {
  pipe_id: "save_content_to_serialized";
  root_ent: RootEnt;
  root_ent_tdo?: RootEntTDO;
  format: string;
  config: any;
  output?: any;
}

export function regist_core_behaviors(core: MixEditor) {
  const { ent, ent_tdo, content, op, pipe, selection, tdo_serialize, plugin } =
    core;

  ent.register_handlers("root", {
    to_tdo: async ({ item: root_ent }) => {
      return create_RootEntTDO(root_ent.id, {
        children: (
          await Promise.all(
            root_ent.children
              .get()
              .map((child) => ent.exec_behavior(child, "to_tdo", {}))
          )
        ).filter((tdo) => tdo !== undefined) as EntTDO[],
      });
    },
  });

  ent_tdo.register_handlers("root", {
    to_ent: async ({ item: root_ent_tdo }) => {
      return create_RootEnt(root_ent_tdo.id, {
        children: (
          await Promise.all(
            root_ent_tdo.children.map((child) =>
              ent_tdo.exec_behavior(child, "to_ent", {})
            )
          )
        ).filter((ent) => ent !== undefined) as Ent[],
      });
    },
  });

  register_TransOp_behavior(op);

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

  // === 数据转换管道 ===
  pipe.set_pipe(
    "load_tdo_to_content",
    create_PipeStage_chain([
      {
        id: "root_fix",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          if (!evt.input.type || evt.input.type !== "root") {
            evt.input = create_RootEntTDO(evt.input.id || "root", {
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
    "load_serialized_to_content",
    create_PipeStage_chain([
      {
        id: "load_serialized_to_tdo",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.output = (await tdo_serialize.deserialize(
            evt.format,
            evt.input,
            evt.config
          )) as RootEntTDO;
        },
      },
      {
        id: "load_tdo_to_content",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          await pipe.execute({
            pipe_id: "load_tdo_to_content",
            input: evt.output,
          });
        },
      },
    ])
  );

  pipe.set_pipe(
    "save_content_to_serialized",
    create_PipeStage_chain([
      {
        id: "get_input",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.root_ent = content.root.get() as RootEnt;
        },
      },
      {
        id: "convert_ent_to_tdo",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.root_ent_tdo = (await ent.exec_behavior(
            evt.root_ent,
            "to_tdo",
            {}
          )) as RootEntTDO;
        },
      },
      {
        id: "convert_tdo_to_serialized",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.output = await tdo_serialize.serialize(
            evt.format,
            evt.root_ent_tdo!,
            evt.config
          );
        },
      },
    ])
  );
}
