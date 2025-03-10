import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { create_BaseEnt, Ent, EntCreateParams } from "../../entity/ent";
import {
  create_BaseEntTDO,
  EntTDO,
  EntTDOCreateParams,
} from "../../entity/tdo/tdo";
import { MixEditor } from "../mix_editor";

export interface RootEnt extends Ent {
  children: WrappedSignal<Ent[]>;
}

/** 创建根实体。 */
export function create_RootEnt(
  params: EntCreateParams<RootEnt, "type" | "children", "children">
): RootEnt {
  const result = create_BaseEnt<RootEnt>("root", params);
  result.children = create_Signal(params.children ?? [], {
    equals: false,
  });
  return result;
}

export interface RootEntTDO extends EntTDO {
  children: EntTDO[];
}

/** 创建根实体TDO。 */
export function create_RootEntTDO(
  params: EntTDOCreateParams<RootEntTDO, "type" | "children">
): RootEntTDO {
  const result = create_BaseEntTDO<RootEntTDO>("root", params);
  result.children = params.children ?? [];
  return result;
}

export function register_root_ent_behavior(editor: MixEditor) {
  editor.ent.register_handlers("root", {
    to_tdo: async ({ item }) => {
      return create_RootEntTDO({
        id: item.id,
        children: await Promise.all(
          item.children.get().map((child) => {
            return editor.ent.exec_behavior(child, "to_tdo", {})!;
          })
        ),
      });
    },
    "tree:child_at": ({ item, index }) => {
      return item.children.get()[index];
    },
    "tree:children": ({ item }) => {
      return item.children.get();
    },
    "tree:index_of_child": ({ item, child }) => {
      return item.children.get().indexOf(child);
    },
    "tree:length": ({ item }) => {
      return item.children.get().length;
    },
    "tree:insert_children": ({ item, children, index }) => {
      const old = item.children.get();
      old.splice(index, 0, ...children);
      item.children.set(old);
    },
    "tree:delete_children": ({ item, from, to }) => {
      const old = item.children.get();
      return old.splice(from, to - from + 1);
    },
  });

  editor.ent_tdo.register_handlers("root", {
    to_ent: async ({ item }) => {
      return create_RootEnt({
        id: item.id,
        children: await Promise.all(
          item.children.map(async (child) => {
            return editor.ent_tdo.exec_behavior(child, "to_ent", {})!;
          })
        ),
      });
    },
  });
}
