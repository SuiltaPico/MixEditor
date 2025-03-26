import { IPipeEvent } from "../../../pipe";
import { MESelection, MixEditor } from "../../mix_editor";
import { MEDataTransfer } from "./io";

export const OutputDataPipeID = "core:output_data";

export interface OutputDataEvent extends IPipeEvent<MixEditor> {
  pipe_id: typeof OutputDataPipeID;
  /** 输出数据的目标。 */
  type: string;
  /** 输出数据的目标选择。 */
  selection?: MESelection;
  /** 输出数据。 */
  data?: any;
}

/** 创建输出数据事件。 */
export function create_OutputDataEvent(
  editor: MixEditor,
  type: string,
  selection?: MESelection
): OutputDataEvent {
  return { pipe_id: OutputDataPipeID, type, selection, ex_ctx: editor };
}
