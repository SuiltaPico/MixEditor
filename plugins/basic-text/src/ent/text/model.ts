import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  create_BaseEnt,
  create_BaseEntTDO,
  Ent,
  EntCreateParams,
  EntTDO,
  EntTDOCreateParams
} from "@mixeditor/core";

/** 文本节点传输对象。 */
export interface TextEntTDO extends EntTDO {
  type: "text";
  content: string;
}

export function create_TextTDO(params: EntTDOCreateParams<TextEntTDO>) {
  const result = create_BaseEntTDO<TextEntTDO>("text", params);
  result.content = params.content;
  return result;
}

/** 文本节点。 */
export interface TextEnt extends Ent {
  type: "text";
  content: WrappedSignal<string>;
}

export function create_TextEnt(
  params: EntCreateParams<TextEnt, "content", "content">
) {
  const result = create_BaseEnt<TextEnt>("text", params);
  result.content = create_Signal(params.content ?? "");
  return result;
}
