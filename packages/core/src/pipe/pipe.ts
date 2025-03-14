import { MaybePromise } from "@mixeditor/common";
import { IPipeStage } from "./pipe_stage";
import { IPipeEvent } from "./pipe_event";

/** 管线 */
export interface IPipe<TEvent extends IPipeEvent<TExCtx>, TExCtx> {
  /** 管线ID */
  id: string;
  /** 设置阶段 */
  set_stage(stage: IPipeStage<TEvent, TExCtx>): void;
  /** 执行管线 */
  execute(
    /** 外部上下文 */
    ex_ctx: TExCtx,
    /** 事件 */
    event: TEvent,
    options?: {
      /** 快速失败 */
      fast_fail?: boolean;
    }
  ): Promise<TEvent>;
}

export class Pipe<TEvent extends IPipeEvent<TExCtx>, TExCtx>
  implements IPipe<TEvent, TExCtx>
{
  private stages: Map<string, IPipeStage<TEvent, TExCtx>>;

  set_stage(stage: IPipeStage<TEvent, TExCtx>): void {
    this.stages.set(stage.id, stage);
  }

  delete_stage(stage_id: string): void {
    this.stages.delete(stage_id);
  }

  async execute(
    /** 外部上下文 */
    ex_ctx: TExCtx,
    /** 事件 */
    event: Omit<TEvent, "ex_ctx"> & {
      ex_ctx?: TExCtx;
    },
    options?: {
      /** 快速失败 */
      fast_fail?: boolean;
    }
  ): Promise<TEvent> {
    // 注入外部上下文
    event.ex_ctx = ex_ctx;

    const { fast_fail = false } = options ?? {};
    const promise_all = fast_fail ? Promise.all : Promise.allSettled;

    const promise_map = new Map<string, MaybePromise<void>>();
    const first_run_pwr = Promise.withResolvers<void>();

    // 收集所有阶段的 promise
    for (const [id, stage] of this.stages) {
      promise_map.set(
        id,
        stage.execute(event as TEvent, async () => {
          await first_run_pwr.promise;
          if (stage.dep_stage_ids) {
            await Promise.all(
              Array.from(stage.dep_stage_ids).map((dep_id) =>
                promise_map.get(dep_id)
              )
            );
          }
        })
      );
    }

    // 开始执行
    first_run_pwr.resolve();

    await promise_all(Array.from(promise_map.values()));

    return event as TEvent;
  }

  constructor(public id: string, stages?: IPipeStage<TEvent, TExCtx>[]) {
    if (stages) {
      this.stages = new Map(stages.map((stage) => [stage.id, stage]));
    } else {
      this.stages = new Map();
    }
  }
}

export default Pipe;
