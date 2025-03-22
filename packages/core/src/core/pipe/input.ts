import { IPipeEvent } from "../../pipe";
import { MixEditor } from "../mix_editor";
import { TreeCaret } from "../selection";
import { MEPack } from "./io";

export const InputDataPipeID = "core:input_data";

/** 输入数据事件。 */
export interface InputDataEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputDataPipeID;
  data: DataTransfer;
  target: TreeCaret;
}

/** 创建输入数据事件。 */
export function create_InputDataEvent(
  editor: MixEditor,
  data: DataTransfer,
  target: TreeCaret
): InputDataEvent {
  return { pipe_id: InputDataPipeID, data, target, ex_ctx: editor };
}

export const InputMEPackPipeID = "core:input_mepack";

/** 输入 MEPack 事件。 */
export interface InputMEPackEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputMEPackPipeID;
  input: MEPack;
  target: TreeCaret;
}

/** 创建输入 MEPack 事件。 */
export function create_InputMEPackEvent(
  editor: MixEditor,
  input: MEPack,
  target: TreeCaret
): InputMEPackEvent {
  return { pipe_id: InputMEPackPipeID, input, target, ex_ctx: editor };
}

export const InputEntsPipeID = "core:input_ents";

/** 输入实体事件。 */
export interface InputEntsEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof InputEntsPipeID;
  ents: string[];
  target: TreeCaret;
}

/** 创建输入实体事件。 */
export function create_InputEntsEvent(
  editor: MixEditor,
  ents: string[],
  target: TreeCaret
): InputEntsEvent {
  return { pipe_id: InputEntsPipeID, ents, target, ex_ctx: editor };
}
