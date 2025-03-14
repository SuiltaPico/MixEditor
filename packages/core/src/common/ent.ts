import { MEEntBehaviorMap, MixEditor } from "../core";
import { EntInitBehavior, GetEntBehaviorHandlerParams } from "../ecs";

export function init_pipe_of<const TEntType extends string>(
  ent_type: TEntType
) {
  return `${ent_type}.init_pipe` as const;
}

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
  const EntInitPipeId = init_pipe_of(ent_type);
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
      async [EntInitBehavior]({ it }) {
        await pipe.execute({
          pipe_id: EntInitPipeId,
          it,
          ex_ctx: editor,
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
