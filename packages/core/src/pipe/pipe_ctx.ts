import Pipe from "./pipe";
import { IPipeEvent } from "./pipe_event";
import { IPipeStage, IPipeStageHandler } from "./pipe_stage";

export type PipeEventMap<TExCtx> = {
  [key: string]: IPipeEvent<TExCtx>;
};

export class PipeCtx<TPipeEventMap extends PipeEventMap<TExCtx>, TExCtx> {
  private pipes = new Map<
    string,
    Pipe<TPipeEventMap[keyof TPipeEventMap], TExCtx>
  >();

  set_pipe<TPipeId extends Extract<keyof TPipeEventMap, string>>(
    pipe_id: TPipeId,
    pipe_stages: Iterable<IPipeStage<TPipeEventMap[TPipeId], TExCtx>>
  ) {
    const new_pipe = new Pipe(pipe_id);
    for (const stage of pipe_stages) {
      new_pipe.set_stage(stage as any);
    }
    this.pipes.set(pipe_id, new_pipe as any);
  }

  set_stage<TPipeId extends Extract<keyof TPipeEventMap, string>>(
    pipe_id: TPipeId,
    stage: IPipeStage<TPipeEventMap[TPipeId], TExCtx>
  ) {
    let pipe = this.pipes.get(pipe_id);
    if (!pipe) {
      pipe = new Pipe(pipe_id);
      this.pipes.set(pipe_id, pipe as any);
    }
    pipe.set_stage(stage as any);
  }

  delete_pipe(pipe_id: string) {
    this.pipes.delete(pipe_id);
  }

  get_pipe<TPipeId extends Extract<keyof TPipeEventMap, string>>(
    pipe_id: TPipeId
  ) {
    return this.pipes.get(pipe_id) as
      | Pipe<TPipeEventMap[TPipeId], TExCtx>
      | undefined;
  }

  async execute<TPipeId extends Extract<keyof TPipeEventMap, string>>(
    event: Omit<TPipeEventMap[TPipeId], "ex_ctx"> & {
      ex_ctx?: TExCtx;
      pipe_id: TPipeId;
    },
    options?: {
      fast_fail?: boolean;
    }
  ) {
    const pipe = this.pipes.get(event.pipe_id);
    if (!pipe) return;

    return (await pipe.execute(
      this.ex_ctx,
      event,
      options
    )) as any as TPipeEventMap[TPipeId];
  }

  constructor(private ex_ctx: TExCtx) {}
}
