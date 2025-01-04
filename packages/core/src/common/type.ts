export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any
  ? R
  : never;

export type ParametersExceptFirst2<F> = F extends (
  arg0: any,
  arg1: any,
  ...rest: infer R
) => any
  ? R
  : never;
