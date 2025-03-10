/** 组件模式。 */
export class CompoSchema {
  /** 策略。 */
  strategy: CompoSchemaStrategy;

  constructor(strategy: CompoSchemaStrategy) {
    this.strategy = strategy;
  }
}
