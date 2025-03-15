import { MEEntBehaviorMap, MixEditor } from "../core";
import { EntInitBehavior, GetEntBehaviorHandlerParams } from "../ecs";

export type EntInitPipeEvent<TPipeId extends string> =
  GetEntBehaviorHandlerParams<MEEntBehaviorMap["init"]> & {
    pipe_id: TPipeId;
  };

/** 初始化阶段执行参数 */
export type InitStageExecuteParams = EntInitPipeEvent<any>;

export interface EntFactoryOptions<
  TNamespace extends string,
  TEntType extends string
> {
  /** 命名空间 */
  namespace: TNamespace;
  /** 实体类型 */
  ent_type: TEntType;
  /** 初始化阶段执行函数 */
  init_stage_execute: (params: InitStageExecuteParams) => Promise<void>;
}

export function create_ent_registration<
  TNamespace extends string,
  TEntType extends string
>(options: EntFactoryOptions<TNamespace, TEntType>) {
  const { namespace, ent_type, init_stage_execute } = options;

  // 创建实体类型和初始化管道
  const EntInitPipeId = `${ent_type}.init_pipe` as const;
  type EntInitPipeEventType = EntInitPipeEvent<typeof EntInitPipeId>;

  // 创建初始化阶段
  const init_stage = {
    id: namespace,
    execute: async (
      event: EntInitPipeEventType,
      wait_deps: () => Promise<void>
    ) => {
      await wait_deps();
      await init_stage_execute(event as any);
    },
  };

  // 注册函数
  function register_ent(editor: MixEditor) {
    const { ecs, pipe } = editor;
    pipe.set_pipe(EntInitPipeId, [init_stage as any]);
    ecs.set_ent_behaviors(ent_type, {
      async [EntInitBehavior]({ it, init_params }) {
        await pipe.execute({
          pipe_id: EntInitPipeId,
          it,
          ex_ctx: editor,
          init_params,
        } as any);
      },
    });

    return () => {
      pipe.get_pipe(EntInitPipeId)?.delete_stage(init_stage.id);
    };
  }

  return {
    EntType: ent_type,
    EntInitPipeId,
    register_ent,
  };
}

export const EntSpecSymbol = Symbol("ent_spec");

/**
 * 创建实体规格对象
 * @param type 实体类型
 * @param params 实体参数
 * @param compos 要附加的组件数组（可选）
 * @returns 实体规格对象
 */
export function ent_spec(type: string, params: any, compos?: any[]) {
  return {
    type,
    params: params || {},
    compos: compos || [],
    [EntSpecSymbol]: true,
  };
}

/**
 * 递归构建实体及其子实体
 * @param editor 编辑器实例
 * @param entSpec 实体规格对象
 * @returns 创建的实体ID
 */
export async function build_ent_specs(
  editor: MixEditor,
  entSpec: any
): Promise<string> {
  if (!entSpec || typeof entSpec !== "object" || !(EntSpecSymbol in entSpec)) {
    throw new Error("无效的实体规格");
  }

  const { type, params = {}, compos = [] } = entSpec;
  const clonedParams = { ...params };

  // 递归处理所有子实体
  const childPromises: Promise<void>[] = [];

  // 处理所有属性，查找嵌套的实体
  for (const key in clonedParams) {
    const value = clonedParams[key];

    if (value && typeof value === "object") {
      if (EntSpecSymbol in value) {
        // 如果是单个实体
        childPromises.push(
          build_ent_specs(editor, value).then((childId) => {
            clonedParams[key] = childId; // 替换为子实体ID
          })
        );
      } else if (Array.isArray(value)) {
        // 如果是实体数组
        const childIds: string[] = [];
        const arrayPromises = value.map(async (item, index) => {
          if (item && typeof item === "object" && EntSpecSymbol in item) {
            const childId = await build_ent_specs(editor, item);
            childIds[index] = childId;
          } else {
            childIds[index] = item;
          }
        });

        childPromises.push(
          Promise.all(arrayPromises).then(() => {
            clonedParams[key] = childIds.filter((id) => id !== undefined); // 替换为子实体ID数组，过滤掉未定义的项
          })
        );
      } else if (value !== null) {
        // 递归检查嵌套对象中的实体
        const processedObject: Record<string, any> = {};
        const objectPromises = Object.entries(value).map(
          async ([objKey, objValue]) => {
            if (
              objValue &&
              typeof objValue === "object" &&
              EntSpecSymbol in objValue
            ) {
              processedObject[objKey] = await build_ent_specs(editor, objValue);
            } else if (Array.isArray(objValue)) {
              // 处理数组中的实体
              const nestedIds = await Promise.all(
                objValue.map(async (item) => {
                  if (
                    item &&
                    typeof item === "object" &&
                    EntSpecSymbol in item
                  ) {
                    return await build_ent_specs(editor, item);
                  }
                  return item;
                })
              );
              processedObject[objKey] = nestedIds;
            } else {
              processedObject[objKey] = objValue;
            }
          }
        );

        childPromises.push(
          Promise.all(objectPromises).then(() => {
            clonedParams[key] = { ...value, ...processedObject };
          })
        );
      }
    }
  }

  // 等待所有子实体创建完成
  await Promise.all(childPromises);

  // 创建当前实体
  const entity = await editor.ecs.create_ent(type, clonedParams);

  // 添加组件
  if (compos && compos.length > 0) {
    editor.ecs.set_compos(entity.id, compos);
  }

  return entity.id;
}
