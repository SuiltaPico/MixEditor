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
import {
  register_root_change_pipe,
  RootChangeEvent,
  RootChangePipeID,
} from "./root_change";

export * from "./io/input";
export * from "./io/io";
export * from "./io/output";
export * from "./life_cycle";
export * from "./root_change";

export function register_pipes(editor: MixEditor) {
  register_life_cycle_pipe(editor);
  register_root_change_pipe(editor);
}

/** MixEditor 的管道事件表，供插件扩展 */
export interface MECorePipeEventMap extends PipeEventMap<any> {
  init: InitEvent;
  destroy: DestroyEvent;
  [InputDataPipeID]: InputDataEvent;
  [InputEntsPipeID]: InputEntsEvent;
  [OutputDataPipeID]: OutputDataEvent;
  [RootChangePipeID]: RootChangeEvent;
}
