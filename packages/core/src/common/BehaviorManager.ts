export class BehaviorManager<TBehavior extends object> {
  private behaviors: Map<
    keyof TBehavior,
    Map<string, TBehavior[keyof TBehavior]>
  > = new Map();
  constructor() {}
}
