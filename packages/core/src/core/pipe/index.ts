import { PipeEventMap } from "../../pipe";
import { MixEditor } from "../mix_editor";
import {
  InputDataEvent,
  InputDataPipeID,
  InputEntsEvent,
  InputEntsPipeID,
} from "./io/input";
import { OutputDataEvent, OutputDataPipeID } from "./io/output";
import {
  DestroyEvent,
  InitEvent,
  register_life_cycle_pipe,
} from "./life_cycle";
// import {
//   LoadEvent,
//   register_load_and_save_pipe,
//   SaveEvent,
// } from "./load_and_save";
// import {
//   LoadSerializedEvent,
//   register_load_and_save_serialized_pipe,
//   SaveSerializedEvent,
// } from "./load_and_save_serialized";

export * from "./life_cycle";
export * from "./load_and_save";
export * from "./load_and_save_serialized";
export * from "./io/io";
export * from "./io/input";
export * from "./io/output";

export function register_pipes(editor: MixEditor) {
  register_life_cycle_pipe(editor);
  // register_load_and_save_pipe(editor);
  // register_load_and_save_serialized_pipe(editor);
}

/** MixEditor 的管道事件表，供插件扩展 */
export interface MECorePipeEventMap extends PipeEventMap<any> {
  init: InitEvent;
  destroy: DestroyEvent;
  [InputDataPipeID]: InputDataEvent;
  [InputEntsPipeID]: InputEntsEvent;
  [OutputDataPipeID]: OutputDataEvent;
  // load: LoadEvent;
  // save: SaveEvent;
  // load_serialized: LoadSerializedEvent;
  // save_serialized: SaveSerializedEvent;
}
