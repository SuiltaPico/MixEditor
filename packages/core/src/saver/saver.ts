import { DocumentTDO } from "../entity/node/nodes/document.ts";
import { TransferDataObject } from "../entity/tdo/tdo.ts";
import { MixEditor } from "../mixeditor.ts";

export type AnyTDO = TransferDataObject & {
  [key: string]: any;
};

export class Saver {
  serializer_map: Record<string, (tdo: TransferDataObject) => any> = {};
  deserializer_map: Record<string, (data: any) => TransferDataObject> = {};

  /** 保存编辑器的文档为文档传输数据对象。 */
  async save() {
    await this.editor.event_manager.emit({
      type: "before_save",
    });
    const emit_result = await this.editor.event_manager.emit(
      {
        type: "save",
        context: {
          save_result: null,
        },
      },
      {
        fast_fail: true,
      }
    );
    const save_result = emit_result.context?.result;
    await this.editor.event_manager.emit({
      type: "after_save",
      save_result,
    });
    return save_result;
  }

  /** 从文档传输数据对象加载文档，并应用到编辑器上。 */
  async load(tdo: DocumentTDO) {
    console.log("load", tdo);
    
    await this.editor.event_manager.emit({
      type: "before_load",
      tdo,
    });
    await this.editor.event_manager.emit(
      {
        type: "load",
        tdo,
      },
      {
        fast_fail: true,
      }
    );
    await this.editor.event_manager.emit({
      type: "after_load",
    });
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
    await this.load(tdo as DocumentTDO);
  }

  constructor(public editor: MixEditor) {
    this.register_serializer("json", (tdo) => {
      return JSON.stringify(tdo);
    });
    this.register_deserializer("json", (data) => {
      return JSON.parse(data);
    });
  }
}
