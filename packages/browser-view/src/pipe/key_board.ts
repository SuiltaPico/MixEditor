export type BvKeyBoardEvent = {
  type: "bv:key_down" | "bv:key_up" | "bv:key_press";
  raw: KeyboardEvent;
};

export interface BvKeyBoardPipeEventMapExtend {
  "bv:key_down": BvKeyBoardEvent & {
    type: "bv:key_down";
  };
  "bv:key_up": BvKeyBoardEvent & {
    type: "bv:key_up";
  };
  "bv:key_press": BvKeyBoardEvent & {
    type: "bv:key_press";
  };
}
