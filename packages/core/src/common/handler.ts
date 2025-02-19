import { MaybePromise } from "@mixeditor/common";

type ConvertToKey<TConvertFormat extends Record<string, any>> =
  `to_${keyof TConvertFormat extends string
    ? keyof TConvertFormat
    : never}`;
// 工具类型：从 convert_to_xxx 键中提取格式类型
type ExtractConvertFormat<
  T,
  TConvertFormat extends Record<string, any>
> = T extends `to_${infer F}`
  ? F extends keyof TConvertFormat
    ? F
    : never
  : never;
export type ConvertHandlerMap<
  TConvertFormat extends Record<string, any>,
  TParams extends any[]
> = {
  [K in ConvertToKey<TConvertFormat>]: (
    ...params: TParams
  ) => MaybePromise<TConvertFormat[ExtractConvertFormat<K, TConvertFormat>]>;
};
