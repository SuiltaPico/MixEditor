/** 组件接口。 */
export interface Compo {
  type: string;
}

/** 组件的数据传输对象。 */
export type CompoTDO<TCompoType = any, TData = any> = [
  type: TCompoType,
  data: TData
];

/** 组件的数据传输对象列表。 */
export type CompoTDOList = CompoTDO[];
