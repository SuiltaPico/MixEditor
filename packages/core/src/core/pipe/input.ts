import { IPipeEvent } from "../../pipe";
import { MESelection, MixEditor } from "../mix_editor";
import { TreeCaret } from "../selection";
import { MEDataTransfer, MEPack } from "./io";

export const InputDataPipeID = "core:input_data";

/** 输入数据事件。 */
export interface InputDataEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputDataPipeID;
  data: MEDataTransfer;
  selection: MESelection;
}

/** 创建输入数据事件。 */
export function create_InputDataEvent(
  editor: MixEditor,
  data: MEDataTransfer,
  selection: MESelection
): InputDataEvent {
  return { pipe_id: InputDataPipeID, data, selection, ex_ctx: editor };
}

export const InputMEPackPipeID = "core:input_mepack";

/** 输入 MEPack 事件。 */
export interface InputMEPackEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputMEPackPipeID;
  input: MEPack;
  selection: MESelection;
}

/** 创建输入 MEPack 事件。 */
export function create_InputMEPackEvent(
  editor: MixEditor,
  input: MEPack,
  selection: MESelection
): InputMEPackEvent {
  return { pipe_id: InputMEPackPipeID, input, selection, ex_ctx: editor };
}

export const InputEntsPipeID = "core:input_ents";

/** 输入实体事件。 */
export interface InputEntsEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputEntsPipeID;
  ents: string[];
  selection: MESelection;
}

/** 创建输入实体事件。 */
export function create_InputEntsEvent(
  editor: MixEditor,
  ents: string[],
  selection: MESelection
): InputEntsEvent {
  return { pipe_id: InputEntsPipeID, ents, selection, ex_ctx: editor };
}
