export type AnyFn = (...args: any[]) => any;
export type Async<T> = T extends (...args: infer P) => infer R ? (...args: P) => Promise<Awaited<R>> : never;
export type IfN<T, T2> = [T] extends [never] ? T2 : T;
