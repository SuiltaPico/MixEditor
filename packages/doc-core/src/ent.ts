import { Ent, MEEntBehaviorHandler } from "@mixeditor/core";
import {
  CaretNavigateContext,
  CaretNavigateDecision,
} from "./pipe/caret_navigate";

export interface EntBehaviorMapExtend {
  "doc:get_child": MEEntBehaviorHandler<{ index: number }, Ent>;
  "doc:get_children": MEEntBehaviorHandler<{}, Ent[]>;
  "doc:get_child_at": MEEntBehaviorHandler<{ index: number }, Ent>;
  "doc:get_children_count": MEEntBehaviorHandler<{}, number>;

  "doc:handle_caret_navigate": MEEntBehaviorHandler<
    CaretNavigateContext,
    CaretNavigateDecision
  >;
}
