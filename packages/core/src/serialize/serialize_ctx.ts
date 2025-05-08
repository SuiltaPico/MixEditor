import { MaybePromise } from "@mixeditor/common";
import { DTO } from "../dto";
import { MEPack } from "../core";

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

export type DTOSerializerMap<TExCtx> = Record<
  string,
  {
    output: any;
    config: any;
    handler: SerializerHandler<any, any, TExCtx>;
  }
>;

export type DTODeserializerMap<TExCtx> = Record<
  string,
  {
    input: any;
    config: any;
    handler: DeserializerHandler<any, any, TExCtx>;
  }
>;

export class DTOSerializeCtx<
  TDTOSerializerMap extends DTOSerializerMap<TExCtx>,
  TDTODeserializerMap extends DTODeserializerMap<TExCtx>,
  TExCtx
> {
  private serializers = new Map<string, SerializerHandler<any, any, TExCtx>>();
  private deserializers = new Map<
    string,
    DeserializerHandler<any, any, TExCtx>
  >();

  register_serializer<TType extends Extract<keyof TDTOSerializerMap, string>>(
    type: TType,
    handler: SerializerHandler<
      TDTOSerializerMap[TType]["config"],
      TDTOSerializerMap[TType]["output"],
      TExCtx
    >
  ) {
    this.serializers.set(type, handler);
  }
  register_deserializer<
    TType extends Extract<keyof TDTODeserializerMap, string>
  >(
    type: TType,
    handler: DeserializerHandler<
      TDTODeserializerMap[TType]["config"],
      TDTODeserializerMap[TType]["input"],
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

  serialize<TType extends Extract<keyof TDTOSerializerMap, string>>(
    type: TType,
    input: MEPack,
    config?: TDTOSerializerMap[TType]["config"]
  ) {
    const serializer = this.serializers.get(type);
    if (!serializer) {
      throw new Error(`Serializer for type ${type} not found`);
    }
    return serializer({
      input,
      config,
      ex_ctx: this.ex_ctx,
    }) as TDTOSerializerMap[TType]["output"];
  }

  deserialize<TType extends Extract<keyof TDTODeserializerMap, string>>(
    type: TType,
    input: TDTODeserializerMap[TType]["input"],
    config?: TDTODeserializerMap[TType]["config"]
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
