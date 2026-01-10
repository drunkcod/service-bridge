import type { Transferable, MessagePort } from 'worker_threads';
import type { ServiceRef } from './ServiceBridge.js';

const Transfer: unique symbol = Symbol('Transfer');

export type Transfer<T> = { [Transfer]: true; readonly value: T; readonly list?: Transferable[] };

export type Transferred<T> = T & { [Transfer]: false };

export type TransferredService<T> = Transferred<ServiceRef<T> & { port: MessagePort }>;

export const transfer: {
	<T extends Transferable>(value: T): Transfer<T>;
	<T>(value: T, list: Transferable[]): Transfer<T>;
} = <T>(value: T, list?: Transferable[]) => ({ [Transfer]: true, value, list } as const);

export function isTransfer(x: unknown): x is Transfer<unknown> {
	return !!x && typeof x === 'object' && Transfer in x;
}
