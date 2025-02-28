import { createSignal, WrappedSignal } from "@mixeditor/common";
import { Ent } from "../../ent/ent";
import { EntTDO } from "../../ent/tdo/tdo";

export interface RootEnt extends Ent {
  children: WrappedSignal<Ent[]>;
}

/** 创建根实体。 */
export function create_RootEnt(
  id: string,
  params: Omit<RootEnt, "id" | "type" | "children"> & {
    children?: Ent[];
  }
): RootEnt {
  const result = params as unknown as RootEnt;
  result.id = id;
  result.type = "root";
  result.children = createSignal(params.children ?? []);
  return result;
}

export interface RootEntTDO extends EntTDO {
  children: EntTDO[];
}

/** 创建根实体TDO。 */
export function create_RootEntTDO(
  id: string,
  params: Omit<RootEntTDO, "id" | "type">
): RootEntTDO {
  const result = params as RootEntTDO;
  result.id = id;
  result.type = "root";
  return result;
}
