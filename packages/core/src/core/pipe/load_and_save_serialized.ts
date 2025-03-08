import { create_PipeStage_chain, IPipeEvent } from "../../pipe";
import { RootEnt, RootEntTDO } from "../ent";
import { MixEditor } from "../mix_editor";

export interface LoadSerializedEvent extends IPipeEvent<MixEditor> {
  pipe_id: "load_serialized";

  /** 要被反序列化的数据 */
  serialized: any;

  /** 要被反序列化的格式 */
  format: string;
  /** 要被反序列化的配置 */
  config: any;

  /** 反序列化后的根实体TDO */
  tdo: RootEntTDO;

  /** 最终被加载到内容中的根实体 */
  ent?: RootEnt;
}
export interface SaveSerializedEvent extends IPipeEvent<MixEditor> {
  pipe_id: "save_serialized";

  /** 要被序列化的根实体 */
  root_ent: RootEnt;

  /** 序列化后的根实体TDO */
  root_ent_tdo?: RootEntTDO;

  /** 要被序列化的格式 */
  format: string;
  /** 要被序列化的配置 */
  config: any;

  /** 序列化后的数据 */
  serialized?: any;
}

export function register_load_and_save_serialized_pipe(editor: MixEditor) {
  const { pipe, ent, content, tdo_serialize } = editor;

  pipe.set_pipe(
    "load_serialized",
    create_PipeStage_chain([
      {
        id: "load_serialized_to_tdo",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.tdo = (await tdo_serialize.deserialize(
            evt.format,
            evt.serialized,
            evt.config
          )) as RootEntTDO;
        },
      },
      {
        id: "load_tdo_to_content",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          await pipe.execute({
            pipe_id: "load",
            input: evt.tdo,
          });
        },
      },
    ])
  );

  pipe.set_pipe(
    "save_serialized",
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
          evt.serialized = await tdo_serialize.serialize(
            evt.format,
            evt.root_ent_tdo!,
            evt.config
          );
        },
      },
    ])
  );
}
