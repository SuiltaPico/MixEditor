import { MECompoBehaviorHandler } from "@mixeditor/core";
import { CaretNavigateContext, CaretNavigateDecision } from "./executor";

export * from "./executor";
export * from "./pipe_handler";
export * from "./preset";

export const DocCaretNavigate = "doc:caret_navigate" as const;
export interface DocCaretNavigateCompoBehavior {
  [DocCaretNavigate]: MECompoBehaviorHandler<
    CaretNavigateContext,
    CaretNavigateDecision
  >;
}
