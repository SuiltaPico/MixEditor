
export type ParametersExceptFirst<F> = F extends (
  arg0: any,
  ...rest: infer R
) => any
  ? R
  : never;

export type ParametersExceptFirst2<F> = F extends (
  arg0: any,
  arg1: any,
  ...rest: infer R
) => any
  ? R
  : never;

export type ReplaceParameter<
  TFunction extends (...args: any) => any,
  TIndex extends number,
  TNewType
> = TFunction extends (...args: infer R) => infer Return
  ? (...args: ReplaceParameterHelper<R, TIndex, TNewType>) => Return
  : never;

type ReplaceParameterHelper<
  TParameters extends any[],
  TIndex extends number,
  TNewType
> = TIndex extends TParameters["length"]
  ? TParameters
  : TIndex extends 0
  ? [TNewType, ...TParameters]
  : [...TParameters[0 & TIndex], TNewType, ...TParameters[TIndex & 0]];
