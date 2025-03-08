import { MarkTDORecord } from "../../mark/tdo/tdo";
import { TDO } from "../../tdo";

/** 实体的传输对象 */
export interface EntTDO extends TDO {
  marks: MarkTDORecord;
}

export type _EntTDOCreateParams<
  TEntTDO extends EntTDO,
  TOptional extends keyof TEntTDO = never
> = {
  [K in keyof TEntTDO as K extends TOptional ? never : K]: TEntTDO[K];
} & {
  [K in keyof TEntTDO as K extends TOptional ? K : never]?: TEntTDO[K];
};

export type EntTDOCreateParams<
  TEntTDO extends EntTDO,
  TOptional extends keyof TEntTDO = never
> = _EntTDOCreateParams<TEntTDO, TOptional | "marks" | "type">;

export function create_BaseEntTDO<TResult extends EntTDO>(
  type: string,
  params: EntTDOCreateParams<EntTDO, never>
) {
  return {
    ...params,
    type,
    marks: params.marks ?? {},
  } satisfies EntTDO as TResult;
}
