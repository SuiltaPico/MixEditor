import { MaybePromise } from "@mixeditor/common";
import { TDO } from "../tdo";
import { MEPack } from "../../core";

export type SerializerHandler<TConfig, TOutput, TExCtx> = (params: {
  input: MEPack;
  config?: TConfig;
  ex_ctx: TExCtx;
}) => MaybePromise<TOutput>;
export type DeserializerHandler<TConfig, TInput, TExCtx> = (params: {
  input: TInput;
  config?: TConfig;
  ex_ctx: TExCtx;
}) => MaybePromise<MEPack>;

export type TDOSerializerMap<TExCtx> = Record<
  string,
  {
    output: any;
    config: any;
    handler: SerializerHandler<any, any, TExCtx>;
  }
>;

export type TDODeserializerMap<TExCtx> = Record<
  string,
  {
    input: any;
    config: any;
    handler: DeserializerHandler<any, any, TExCtx>;
  }
>;

export class TDOSerializeCtx<
  TTDOSerializerMap extends TDOSerializerMap<TExCtx>,
  TTDODeserializerMap extends TDODeserializerMap<TExCtx>,
  TExCtx
> {
  private serializers = new Map<string, SerializerHandler<any, any, TExCtx>>();
  private deserializers = new Map<
    string,
    DeserializerHandler<any, any, TExCtx>
  >();

  register_serializer<TType extends Extract<keyof TTDOSerializerMap, string>>(
    type: TType,
    handler: SerializerHandler<
      TTDOSerializerMap[TType]["config"],
      TTDOSerializerMap[TType]["output"],
      TExCtx
    >
  ) {
    this.serializers.set(type, handler);
  }
  register_deserializer<
    TType extends Extract<keyof TTDODeserializerMap, string>
  >(
    type: TType,
    handler: DeserializerHandler<
      TTDODeserializerMap[TType]["config"],
      TTDODeserializerMap[TType]["input"],
      TExCtx
    >
  ) {
    this.deserializers.set(type, handler);
  }
  unregister_serializer(type: string) {
    this.serializers.delete(type);
  }
  unregister_deserializer(type: string) {
    this.deserializers.delete(type);
  }

  serialize<TType extends Extract<keyof TTDOSerializerMap, string>>(
    type: TType,
    input: MEPack,
    config?: TTDOSerializerMap[TType]["config"]
  ) {
    const serializer = this.serializers.get(type);
    if (!serializer) {
      throw new Error(`Serializer for type ${type} not found`);
    }
    return serializer({
      input,
      config,
      ex_ctx: this.ex_ctx,
    }) as TTDOSerializerMap[TType]["output"];
  }

  deserialize<TType extends Extract<keyof TTDODeserializerMap, string>>(
    type: TType,
    input: TTDODeserializerMap[TType]["input"],
    config?: TTDODeserializerMap[TType]["config"]
  ) {
    const deserializer = this.deserializers.get(type);
    if (!deserializer) {
      throw new Error(`Deserializer for type ${type} not found`);
    }
    return deserializer({
      input,
      config,
      ex_ctx: this.ex_ctx,
    });
  }

  constructor(public ex_ctx: TExCtx) {}
}
