export type BvKeyBoardEvent = {
  pipe_id: "bv:key_down" | "bv:key_up" | "bv:key_press";
  raw: KeyboardEvent;
};

export interface BvKeyBoardPipeEventMapExtend {
  "bv:key_down": BvKeyBoardEvent & {
    pipe_id: "bv:key_down";
  };
  "bv:key_up": BvKeyBoardEvent & {
    pipe_id: "bv:key_up";
  };
  "bv:key_press": BvKeyBoardEvent & {
    pipe_id: "bv:key_press";
  };
}
