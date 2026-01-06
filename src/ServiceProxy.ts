import type { ServiceBridge, FnRef } from './ServiceBridge.js';

export type ServiceProxy<T> = {
	[P in keyof T]: FnUnref<T[P]>;
};

export type FnUnref<T> = T extends FnRef<infer Fn> ? (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>> : never;

export const makeProxy = <T extends object>(x: T, worker: ServiceBridge): ServiceProxy<T> => {
	const thunks: Record<string | symbol, Function> = Object.create(null);
	return new Proxy(x, {
		get(target, prop) {
			const found = thunks[prop];
			if (found) return found;
			const fnName = Reflect.get(target, prop);
			if (typeof fnName === 'string') {
				const thunk = (...args: unknown[]) => worker.call(fnName, ...args);
				thunks[prop] = thunk;
				return thunk;
			}
			return fnName;
		},
	}) as ServiceProxy<T>;
};
