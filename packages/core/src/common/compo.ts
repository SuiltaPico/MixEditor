import { MixEditor } from "../core";

export type CustomDecisionFnParams<T> = {
  editor: MixEditor;
  ent_id: string;
} & T;
