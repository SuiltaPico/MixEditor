export function bind_methods<
  T extends { [P in M]: (...args: any[]) => any },
  U extends { [P in M]: (...args: any[]) => any },
  M extends keyof U
>(target: T, from: U, methods: M[]) {
  for (const method of methods) {
    target[method] = from[method].bind(from) as any;
  }
}
