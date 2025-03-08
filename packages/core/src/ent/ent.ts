import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { MarkRecord } from "../mark/mark";

/** 实体。编辑器的最小内容单元。 */
export interface Ent {
  /** 实体的唯一标识。 */
  id: string;
  /** 实体的类型。 */
  type: string;
  /** 实体的标记。 */
  marks: WrappedSignal<MarkRecord>;
}

/**
 * 从实体类型创建参数的泛型类型
 * @template TEnt 实体类型
 * @template TOptional 可选键的联合类型
 * @template TSignal 信号键的联合类型
 */
export type _EntCreateParams<
  TEnt,
  TOptional extends keyof TEnt = never,
  TSignal extends keyof TEnt = never
> = {
  // 处理必填键
  [K in keyof TEnt as K extends TOptional
    ? never
    : K extends TSignal
    ? never
    : K]: TEnt[K];
} & {
  // 处理必填信号键
  [K in keyof TEnt as K extends TOptional
    ? never
    : K extends TSignal
    ? K
    : never]: TEnt[K] extends WrappedSignal<infer T> ? T : never;
} & {
  // 处理可选信号键
  [K in keyof TEnt as K extends TOptional
    ? K extends TSignal
      ? K
      : never
    : never]?: TEnt[K] extends WrappedSignal<infer T> ? T : never;
} & {
  // 处理可选键
  [K in keyof TEnt as K extends TOptional
    ? K extends TSignal
      ? never
      : K
    : never]?: TEnt[K];
};

export type EntCreateParams<
  TEnt extends Ent,
  TOptional extends keyof TEnt = never,
  TSignal extends keyof TEnt = never
> = _EntCreateParams<TEnt, TOptional | "marks" | "type", TSignal | "marks">;

export function create_BaseEnt<TResult extends Ent>(
  type: string,
  params: EntCreateParams<Ent, never, never>
) {
  return {
    ...params,
    type,
    marks: create_Signal<MarkRecord>(params.marks ?? new Map(), {
      equals: false,
    }),
  } satisfies Ent as TResult;
}
