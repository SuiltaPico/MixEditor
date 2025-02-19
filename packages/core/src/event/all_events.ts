import { NavigateDirection } from "../common/navigate";
import { DocumentTDO } from "../entity/node/nodes";
import { DeleteSelectedEvent } from "./delete_select";

export interface AllEvents {
  /** 编辑器核心初始化。 */
  init: {
    type: "init";
  };
  before_save: {
    type: "before_save";
  };
  save: {
    type: "save";
    context: {
      save_result: any;
    };
  };
  after_save: {
    type: "after_save";
    save_result: any;
  };
  before_load: {
    type: "before_load";
    tdo: DocumentTDO;
  };
  load: {
    type: "load";
    tdo: DocumentTDO;
  };
  after_load: {
    type: "after_load";
  };
  /** 光标导航。 */
  caret_navigate: {
    type: "caret_navigate";
    direction: NavigateDirection;
  };
  /** 删除选区。 */
  delete_selected: DeleteSelectedEvent;
}
