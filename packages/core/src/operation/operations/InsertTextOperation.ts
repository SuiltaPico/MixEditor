import { MixEditor } from "../../MixEditor";
import { Operation } from "../Operation";

// 添加插入文本操作
export class InsertTextOperation implements Operation {
  id = "insert_text" as const;
  type = "insert_text" as const;
  data = {
    position: 0,
    text: ""
  };
  version = 1;

  constructor(
    public position: number,
    public text: string
  ) {}

  async execute(editor: MixEditor) {
    // TODO: 在指定位置插入文本
  }

  async undo(editor: MixEditor) {
    // TODO: 撤销文本插入
  }
}