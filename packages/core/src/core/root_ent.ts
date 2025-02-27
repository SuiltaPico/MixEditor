import { Ent, EntTDO } from "../ent/ent";

export interface RootEnt extends Ent {
  children: Ent[];
}

/** 创建根实体。 */
export function create_RootEnt(
  id: string,
  params: Omit<RootEnt, "id" | "type">
): RootEnt {
  const result = params as RootEnt;
  result.id = id;
  result.type = "root";
  return result;
}

export interface RootEntTDO {
  children: EntTDO[];
}
