import { Doc, XmlElement } from "yjs";
import { NodeManager } from "./entity/node/manager";
import {
  NodeManagerHandlerMap,
  NodeManagerStrategyMap,
} from "./entity/node/maps";
import { AllNodeTypes } from "./entity/node/node";
import { UlidIdGenerator } from "@mixeditor/common";
import { NodeTDOHandlerManager } from "./entity/node";
import { EventManager } from "./event";

export type MixEditorNodeManager = NodeManager<
  AllNodeTypes,
  NodeManagerHandlerMap<AllNodeTypes>,
  NodeManagerStrategyMap
>;

export class MixEditor {
  /** 文档。 */
  ydoc: Doc = new Doc();
  /** 文档根节点。 */
  root: XmlElement = this.ydoc.getXmlElement("root");
  /** 文档 id 生成器。 */
  id_generator = new UlidIdGenerator();

  node_manager: MixEditorNodeManager = new NodeManager(this);
  node_tdo_manager: NodeTDOHandlerManager = new NodeTDOHandlerManager(this);

  /** 事件管理器。 */
  event_manager = new EventManager(this);

  /** 生成文档 id。 */
  gen_id() {
    return this.id_generator.next();
  }
}
