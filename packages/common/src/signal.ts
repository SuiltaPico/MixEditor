import {
  Accessor,
  Setter,
  Signal,
  createSignal as solid_createSignal,
} from "solid-js";

export class WrappedSignal<T> {
  get: Accessor<T>;
  set: Setter<T>;
  constructor([get, set]: ReturnType<typeof solid_createSignal<T>>) {
    this.get = get;
    this.set = set;
  }
}

export function create_Signal<T>(
  ...args: Parameters<typeof solid_createSignal<T>>
) {
  if (args[1]) {
    if (args[1].equals === undefined) {
      args[1].equals = false;
    }
  } else {
    args[1] = {
      equals: false,
    };
  }
  const [get_signal, set_signal] = solid_createSignal(...args);
  return new WrappedSignal([get_signal, set_signal]);
}

export class EmitterSignal {
  signal: Signal<undefined> = solid_createSignal(undefined, {
    equals: false,
  });
  use() {
    this.signal[0]();
  }
  emit() {
    this.signal[1](undefined);
  }
  constructor() {}
}

export function create_EmitterSignal() {
  return new EmitterSignal();
}
