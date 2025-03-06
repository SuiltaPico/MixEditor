/** 标记。 */
export interface Mark {
  /** 标记的类型。 */
  type: string;
}

/** 标记记录。 */
export type MarkRecord = Map<string, Mark>;
