export class TwoLevelTypeMap<TMasterRecord extends object> {
  private map: Map<
    keyof TMasterRecord,
    Map<string, TMasterRecord[keyof TMasterRecord]>
  > = new Map();
  get<T extends keyof TMasterRecord>(master_type: T, segment_type: string) {
    return this.map.get(master_type)?.get(segment_type);
  }
  set<T extends keyof TMasterRecord>(
    master_type: T,
    segment_type: string,
    value: TMasterRecord[T]
  ) {
    if (!this.map.has(master_type)) {
      this.map.set(master_type, new Map());
    }
    this.map.get(master_type)?.set(segment_type, value);
  }
  remove<T extends keyof TMasterRecord>(
    master_type: T,
    segment_type: string
  ) {
    this.map.get(master_type)?.delete(segment_type);
  }
  constructor() {}
}
