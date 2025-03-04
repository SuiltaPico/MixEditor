import { BvKeyBoardPipeEventMapExtend } from "./key_board";
import { BvPointerPipeEventMapExtend } from "./Pointer";

export * from "./key_board";
export * from "./Pointer";

export interface PipeEventMapExtend
  extends BvKeyBoardPipeEventMapExtend,
    BvPointerPipeEventMapExtend {}
