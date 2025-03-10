import { UlidIdGenerator } from "@mixeditor/common";
import { Ent } from "./ent";
import { EntSchema } from "./ent_schema";
import { Compo } from "./compo";

/** 实体上下文。 */
export class EntCtx<
  TCompoMap extends Record<string, Compo>,
  TCompoStrategyMap extends Record<string, CompoSchemaStrategy>,
  TExCtx extends any
> {
  /** 实体ID生成器。 */
  private id_generator = new UlidIdGenerator();

  /** 实体表。 */
  private ents = new Map<string, Ent<TCompoMap>>();

  /** 实体模式。 */
  private ent_schemas = new Map<string, EntSchema>();

  /** 生成新的实体ID。 */
  gen_id() {
    return this.id_generator.next();
  }

  /** 注册实体模式。 */
  register_ent_schema(schema: EntSchema) {
    this.ent_schemas.set(schema.type, schema);
  }

  /** 获取实体。 */
  get_ent(id: string) {
    return this.ents.get(id);
  }

  /** 创建实体。 */
  create_ent(type: string) {
    const id = this.gen_id();
    const ent = new Ent<TCompoMap>(id, type);
    ent.set_compos(
      this.ent_schemas.get(type)?.init_comps(this.ex_ctx) ?? new Map()
    );
    this.ents.set(id, ent);
    return ent;
  }

  /** 删除实体。 */
  delete_ent(id: string) {
    this.ents.delete(id);
  }

  constructor(public ex_ctx: TExCtx) {}
}