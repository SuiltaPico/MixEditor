## 移动
核心库支持光标的顺序移动，即移动到上一个节点和下一个节点。

在 Selection 的 `move` 方法中，会触发一个 `caret_move` 事件。核心默认提供了 `caret_move` 事件的处理器，是处理移动的责任链。

责任链的执行流程如下：
1. 设当前节点为当前 Selection 的聚焦节点。
2. 向当前节点发送 `caret_move_enter` 事件，附带移动方向、期望进入索引和来源。
3. 根据 `caret_move_enter` 事件的返回值，确定被处理的状态：
  - 如果返回值为 `CaretMoveEnterCommand.skip`，则表示跳过当前节点，继续责任链。
  - 如果返回值为 `CaretMoveEnterCommand.done(index)`，则表示移动成功，结束责任链。
  - 如果返回值为 `CaretMoveEnterCommand.enter_child(index)`，则表示需要进入子节点，继续责任链。

