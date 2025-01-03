import { MixEditor } from "./MixEditor";
import { Node } from "./node/Node";

/** 传输数据对象。用于保存和传输数据。 */
export interface TransferDataObject {
  type: string;
  data: any;
}

export interface DocumentTransferDataObject extends TransferDataObject {
  type: "document";
  data: {
    schema_version: number;
    created_at: Date;
    modified_at: Date;
    root_node: TransferDataObject;
  };
}

export class Saver {
  serializer_map: Record<string, (tdo: TransferDataObject) => any> = {};
  deserializer_map: Record<string, (data: any) => TransferDataObject> = {};

  loader_map: Record<string, (tdo: TransferDataObject) => Node> = {};

  /** 保存编辑器的文档为文档传输数据对象。 */
  async save() {
    try {
      await this.editor.event_manager.emit({
        event_type: ".before_save",
      });
    } catch (error) {
      console.warn("[MixEditor:Saver] before_save 流程出错", error);
    }
    const result = await this.editor.event_manager.emit({
      event_type: ".save",
    });
    try {
      await this.editor.event_manager.emit({
        event_type: ".after_save",
      });
    } catch (error) {
      console.warn("[MixEditor:Saver] after_save 流程出错", error);
    }
    return result.tdo;
  }

  /** 从文档传输数据对象加载文档，并应用到编辑器上。 */
  async load(tdo: DocumentTransferDataObject) {
    try {
      await this.editor.event_manager.emit({
        event_type: ".before_load",
      });
    } catch (error) {
      console.warn("[MixEditor:Saver] before_load 流程出错", error);
    }
    await this.editor.event_manager.emit({
      event_type: ".load",
    });
    try {
      await this.editor.event_manager.emit({
        event_type: ".after_load",
      });
    } catch (error) {
      console.warn("[MixEditor:Saver] after_load 流程出错", error);
    }
  }

  /** 保存节点为传输数据对象。 */
  async save_node(node: Node) {
    const tdo = await this.editor.node_manager.save(node);
    return tdo;
  }

  /** 从传输数据对象加载节点。 */
  async load_node(tdo: TransferDataObject) {
    const node = await this.loader_map[tdo.type](tdo);
    return node;
  }

  /** 注册传输数据对象的序列化器。 */
  async register_serializer(
    type: string,
    serializer: (tdo: TransferDataObject) => any
  ) {
    this.serializer_map[type] = serializer;
  }

  /** 注册传输数据对象的反序列化器。 */
  async register_deserializer(
    type: string,
    deserializer: (data: any) => TransferDataObject
  ) {
    this.deserializer_map[type] = deserializer;
  }

  /** 序列化传输数据对象。 */
  async serialize(type: string, tdo: TransferDataObject) {
    const serializer = this.serializer_map[type];
    if (!serializer) {
      throw new Error(`Serializer for type ${type} not found`);
    }
    return serializer(tdo);
  }

  /** 反序列化传输数据对象。 */
  async deserialize(type: string, data: any) {
    const deserializer = this.deserializer_map[type];
    if (!deserializer) {
      throw new Error(`Deserializer for type ${type} not found`);
    }
    return deserializer(data);
  }

  /** 保存文档为指定类型的数据。 */
  async save_to(type: string) {
    const tdo = await this.save();
    const data = await this.serialize(type, tdo);
    return data;
  }

  /** 从指定类型的数据加载文档，并应用到编辑器上。 */
  async load_from(type: string, data: any) {
    const tdo = await this.deserialize(type, data);
    await this.load(tdo as DocumentTransferDataObject);
  }

  constructor(public editor: MixEditor) {
    this.register_serializer("json", (tdo) => {
      return JSON.stringify(tdo.data);
    });
    this.register_deserializer("json", (data) => {
      return JSON.parse(data);
    });
  }
}
