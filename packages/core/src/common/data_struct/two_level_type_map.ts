export class TwoLevelTypeMap<
  TMasterKey extends any,
  TSegmentKey extends any,
  TValue
> {
  private map: Map<TMasterKey, Map<TSegmentKey, TValue>> = new Map();
  get_master_keys() {
    return this.map.keys();
  }
  get_segment_keys(master_key: TMasterKey) {
    return this.map.get(master_key)?.keys();
  }
  get(master_type: TMasterKey, segment_type: TSegmentKey) {
    return this.map.get(master_type)?.get(segment_type);
  }
  get_master(master_type: TMasterKey) {
    return this.map.get(master_type);
  }
  set(master_type: TMasterKey, segment_type: TSegmentKey, value: TValue) {
    let master_map = this.map.get(master_type);
    if (!master_map) {
      master_map = new Map();
      this.map.set(master_type, master_map);
    }
    master_map.set(segment_type, value);
  }
  delete(master_type: TMasterKey, segment_type: TSegmentKey) {
    this.map.get(master_type)?.delete(segment_type);
  }
  delete_master(master_type: TMasterKey) {
    this.map.delete(master_type);
  }
}
