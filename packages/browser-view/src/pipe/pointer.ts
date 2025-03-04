export type BvPointerEvent = {
  type: "bv:pointer_down" | "bv:pointer_up" | "bv:pointer_move";
  raw: PointerEvent;
};

export interface BvPointerPipeEventMapExtend {
  "bv:pointer_down": BvPointerEvent & {
    type: "bv:pointer_down";
  };
  "bv:pointer_up": BvPointerEvent & {
    type: "bv:pointer_up";
  };
  "bv:pointer_move": BvPointerEvent & {
    type: "bv:pointer_move";
  };
}
