// import { Ent, EntTDO } from "../../ecs";
// import { create_PipeStage_chain, IPipeEvent } from "../../pipe";
// import { MixEditor } from "../mix_editor";
// import { SavedData } from "./load_and_save";

// export interface LoadSerializedEvent extends IPipeEvent<MixEditor> {
//   pipe_id: "load_serialized";

//   /** 要被反序列化的数据 */
//   serialized: any;

//   /** 要被反序列化的格式 */
//   format: string;
//   /** 要被反序列化的配置 */
//   config: any;

//   /** 反序列化后的根实体TDO */
//   saved_data: SavedData;

//   /** 最终被加载到内容中的根实体 */
//   ent?: string;
// }
// export interface SaveSerializedEvent extends IPipeEvent<MixEditor> {
//   pipe_id: "save_serialized";

//   /** 要被序列化的根实体 */
//   root_ent: string;

//   /** 序列化后的根实体TDO */
//   saved_data?: SavedData;

//   /** 要被序列化的格式 */
//   format: string;
//   /** 要被序列化的配置 */
//   config: any;

//   /** 序列化后的数据 */
//   serialized?: any;
// }

// export function register_load_and_save_serialized_pipe(editor: MixEditor) {
//   const { pipe, tdo_serialize } = editor;

//   pipe.set_pipe(
//     "load_serialized",
//     create_PipeStage_chain([
//       {
//         id: "deserialize_to_tdo",
//         execute: async (evt, wait_deps) => {
//           await wait_deps();
//           evt.saved_data = await tdo_serialize.deserialize(
//             evt.format,
//             evt.serialized,
//             evt.config
//           );
//         },
//       },
//       {
//         id: "load_tdo_to_content",
//         execute: async (evt, wait_deps) => {
//           await wait_deps();
//           await pipe.execute({
//             pipe_id: "load",
//             input: evt.saved_data,
//           });
//         },
//       },
//     ])
//   );

//   pipe.set_pipe(
//     "save_serialized",
//     create_PipeStage_chain([
//       {
//         id: "save_to_tdo",
//         execute: async (evt, wait_deps) => {
//           await wait_deps();
//           const saved = await pipe.execute({
//             pipe_id: "save",
//             input: evt.root_ent,
//           });
//           evt.saved_data = saved?.output;
//         },
//       },
//       {
//         id: "serialize_from_tdo",
//         execute: async (evt, wait_deps) => {
//           await wait_deps();
//           evt.serialized = await tdo_serialize.serialize(
//             evt.format,
//             evt.saved_data!,
//             evt.config
//           );
//         },
//       },
//     ])
//   );
// }
