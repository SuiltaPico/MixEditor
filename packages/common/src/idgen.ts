import { monotonicFactory } from "ulid";
interface IdGenerator {
  next(): string;
}

export class UlidIdGenerator implements IdGenerator {
  private ulid = monotonicFactory();

  next() {
    return this.ulid();
  }
}
