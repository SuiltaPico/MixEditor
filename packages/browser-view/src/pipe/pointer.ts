export type BvPointerEvent = {
  pipe_id: "bv:pointer_down" | "bv:pointer_up" | "bv:pointer_move";
  raw: PointerEvent;
};

export interface BvPointerPipeEventMapExtend {
  "bv:pointer_down": BvPointerEvent & {
    pipe_id: "bv:pointer_down";
  };
  "bv:pointer_up": BvPointerEvent & {
    pipe_id: "bv:pointer_up";
  };
  "bv:pointer_move": BvPointerEvent & {
    pipe_id: "bv:pointer_move";
  };
}
