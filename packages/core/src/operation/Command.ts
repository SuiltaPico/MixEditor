export interface Command {
  id: string;
  meta: {
    name: string;
  };
  /** 执行命令。*/
  execute(): void | Promise<void>;
  /** 撤销命令。*/
  undo(): void | Promise<void>;
}
