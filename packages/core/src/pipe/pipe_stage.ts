import { MaybePromise } from "@mixeditor/common";
import { IPipeEvent } from "./pipe_event";

/** 管线阶段处理器。负责完成该阶段任务。 */
export type IPipeStageHandler<TEvent extends IPipeEvent<TExCtx>, TExCtx> = (
  /** 事件 */
  event: TEvent,
  /** 等待前置阶段完成 */
  wait_deps: () => Promise<void>
) => MaybePromise<void>;

/** 管线阶段 */
export interface IPipeStage<TEvent extends IPipeEvent<TExCtx>, TExCtx> {
  /** 阶段ID */
  id: string;
  /** 前置阶段ID */
  dep_stage_ids?: Set<string>;
  /** 执行阶段 */
  execute: IPipeStageHandler<TEvent, TExCtx>;
}

/** 创建管线阶段链 */
export function create_PipeStage_chain<
  TEvent extends IPipeEvent<TExCtx>,
  TExCtx
>(stages: IPipeStage<TEvent, TExCtx>[]): IPipeStage<TEvent, TExCtx>[] {
  for (let i = 1; i < stages.length; i++) {
    const stage = stages[i];
    if (!stage.dep_stage_ids) {
      stage.dep_stage_ids = new Set();
    }
    stage.dep_stage_ids.add(stages[i - 1].id);
  }
  return stages;
}
