import type { Transferable } from 'worker_threads';

const Transfer: unique symbol = Symbol('Transfer');

export type Transfer<T> = { [Transfer]: true; readonly value: T; readonly list?: Transferable[] };

export type Transferred<T> = T & { [Transfer]: false };

export const transfer = <T>(value: T, list?: Transferable[]) => ({ [Transfer]: true, value, list } as const);

export function isTransfer(x: unknown): x is Transfer<unknown> {
	return !!x && typeof x === 'object' && Transfer in x;
}
