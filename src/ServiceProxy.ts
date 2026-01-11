import { filterInPlace } from './filterInPlace.js';
import type { IfN } from './types.js';
import type { ServiceBridge, FnRef } from './ServiceBridge.js';

export type ServiceProxy<T> = {
	[P in keyof T]: IfN<FnUnref<T[P]>, ServiceProxy<T[P]>>;
};

export type FnUnref<T> = T extends FnRef<infer Fn> ? (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>> : never;

export const serviceProxy = <T extends object>(bridge: ServiceBridge, x: T): ServiceProxy<T> => {
	const makeThunk = (x: unknown) => {
		if (!x) return x;
		if (typeof x === 'string') {
			return Object.defineProperty((...args: unknown[]) => bridge.call(x, ...args), 'name', { value: x });
		} else if (typeof x === 'object') return serviceProxy(bridge, x);
		return undefined;
	};
	const thunks = Object.entries(x).map(([prop, x]) => [prop, makeThunk(x)]);
	filterInPlace(thunks, ([_, x]) => !!x);
	return Object.fromEntries(thunks) as ServiceProxy<T>;
};
