import { MECompoBehaviorHandler } from "@mixeditor/core";
import { MergeContext, MergeDecision } from "./executor";

export const handle_default_merge: MECompoBehaviorHandler<
  MergeContext,
  MergeDecision
> = async () => {
  return MergeDecision.Allow;
};
