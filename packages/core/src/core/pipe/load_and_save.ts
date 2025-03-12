import { Ent, EntTDO } from "../../ecs";
import { create_PipeStage_chain, IPipeEvent } from "../../pipe";
import { MixEditor } from "../mix_editor";

/** 加载事件。 */
export interface LoadEvent extends IPipeEvent<MixEditor> {
  pipe_id: "load";
  input: SavedData;
  output?: Ent;
}

/** 保存事件。 */
export interface SaveEvent extends IPipeEvent<MixEditor> {
  pipe_id: "save";
  input?: Ent;
  output?: SavedData;
}

/** 保存的数据。 */
export interface SavedData {
  /** 所有实体TDO。不包含 `entry_tdo`。 */
  tdos: EntTDO[];
  /** 入口实体TDO。不记录在 `tdos` 中。 */
  entry_tdo: EntTDO;
}

export function register_load_and_save_pipe(editor: MixEditor) {
  const { pipe, ecs, content } = editor;

  pipe.set_pipe(
    "load",
    create_PipeStage_chain([
      {
        id: "load_to_ent",
        execute: async (evt, wait_deps) => {
          await wait_deps();

          // 合并加载列表并去重
          const loadSet = new Set([...evt.input.tdos, evt.input.entry_tdo]);

          // 批量加载所有实体
          await Promise.all([...loadSet].map((tdo) => ecs.load_ent_tdo(tdo)));

          // 获取入口实体
          const entryEnt = ecs.ents.get(evt.input.entry_tdo.id);
          if (!entryEnt) {
            throw new Error(
              `入口实体 ${evt.input.entry_tdo.id} 加载失败，请检查数据完整性`
            );
          }

          evt.output = entryEnt;
        },
      },
      {
        id: "apply_output",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          if (!evt.output) throw new Error("加载流程未生成有效实体");
          content.root.set(evt.output);
        },
      },
    ])
  );

  pipe.set_pipe(
    "save",
    create_PipeStage_chain([
      {
        id: "get_input",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          evt.input = content.root.get() as Ent;
          if (!evt.input) throw new Error("保存失败：未找到根实体。");
        },
      },
      {
        id: "save_to_tdo",
        execute: async (evt, wait_deps) => {
          await wait_deps();
          if (!evt.input) return;

          const tdos: EntTDO[] = [];
          const processed_ents = new Set<string>();
          let entry_tdo: EntTDO;

          const save_entity = async (ent_id: string) => {
            if (processed_ents.has(ent_id)) return;
            processed_ents.add(ent_id);

            const ent = ecs.get_ent(ent_id);
            if (!ent) {
              console.warn(`实体 ${ent_id} 不存在，跳过保存。`);
              return;
            }

            let dependencies: string[] = [];
            const tdo = await ecs.save_ent_tdo(ent, (deps) => {
              dependencies.push(...deps);
            });

            // 递归处理依赖
            await Promise.all(
              dependencies.map((dep_id) => save_entity(dep_id))
            );

            // 区分入口实体和其他实体
            if (ent_id === evt.input!.id) {
              entry_tdo = tdo;
            } else {
              tdos.push(tdo);
            }
          };

          await save_entity(evt.input.id);

          if (!entry_tdo!) {
            throw new Error("入口实体TDO生成失败");
          }

          evt.output = {
            tdos,
            entry_tdo,
          };
        },
      },
    ])
  );
}
