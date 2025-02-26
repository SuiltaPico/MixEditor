export interface Ent {
  id: string;
  type: string;
  children: Ent[];
}

export interface EntTDO {
  id: string;
  type: string;
  children: EntTDO[];
}
