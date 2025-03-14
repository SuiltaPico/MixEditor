import { BvKeyBoardPipeEventMapExtend } from "./key_board";
import { BvPointerPipeEventMapExtend } from "./pointer";

export * from "./key_board";
export * from "./pointer";
export * from "./render_selection/executor";

export interface PipeEventMapExtend
  extends BvKeyBoardPipeEventMapExtend,
    BvPointerPipeEventMapExtend {}
