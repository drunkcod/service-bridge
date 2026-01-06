import type { MessagePort, Worker } from 'worker_threads';

import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

import { SlotBuffer } from './SlotBuffer.js';
import { BridgeCommand } from './BridgeCommand.js';
import { ServiceBridgeCallError } from './SerciveBridgeCallError.js';

export type AnyFn = (...args: any[]) => any;

const _FnRef: unique symbol = Symbol('FnRef');
export type FnRef<T extends AnyFn> = string & { [_FnRef]: T };

export type ServiceBridgeWorkerErrorReply = { name: string; message: string; cause?: unknown; stack?: string };

export type ServiceBridgeWorkerResult = [bigint, null, unknown] | [bigint, ServiceBridgeWorkerErrorReply, null];

export interface ServiceBrdigeConfig {
	add<T extends AnyFn>(method: string, fn: T): FnRef<T>;
	import(relPath: string): Promise<unknown>;
}
export type ServiceBridgeConfigurator<T> = (bridge: ServiceBrdigeConfig) => T;

type WorkerPort = MessagePort | Worker;

export class ServiceBridge {
	readonly port;
	readonly slots;

	constructor(port: WorkerPort, maxSlots: number = 1024) {
		this.port = port;
		this.slots = new SlotBuffer<{ resolve: (result: any) => void; reject: (reason?: any) => void }>(maxSlots);
		port.on('message', (message) => this.#onMessage(message));
	}

	config<T extends ServiceBridgeConfigurator<ReturnType<T>>>(fn: T): Promise<ReturnType<T>>;
	config<T extends ServiceBridgeConfigurator<ReturnType<T>>>(baseUrl: string, fn: T): Promise<ReturnType<T>>;
	config<T extends ServiceBridgeConfigurator<ReturnType<T>>>(baseUrlOrFn: string | T, fn?: T): Promise<ReturnType<T>> {
		let baseUrl: string;
		let fnDef: string;
		if (typeof baseUrlOrFn === 'string') {
			const path = asPath(baseUrlOrFn);
			baseUrl = path.endsWith('.js') || path.endsWith('.ts') ? dirname(path) : path;
			fnDef = fn!.toString();
		} else {
			baseUrl = calleeRoot(ServiceBridge.prototype.config);
			fnDef = baseUrlOrFn.toString();
		}
		return this.#postMessage(BridgeCommand.config, fnDef, baseUrl);
	}

	call<T extends AnyFn>(fn: FnRef<T>, ...args: Parameters<T>): Promise<ReturnType<T>>;
	call(fn: string, ...args: unknown[]): Promise<unknown>;
	async call(fn: string, ...args: unknown[]): Promise<unknown> {
		try {
			return await this.#postMessage(BridgeCommand.call, fn, ...args);
		} catch (err) {
			if (err instanceof Error && err.stack) {
				const localStack = Object.create(null);
				Error.captureStackTrace(localStack, ServiceBridge.prototype.call);
				err.stack = `${err.stack}\n    [⚡️ ServiceBridge Boundary ⚡️]${localStack.stack.substring('Error'.length)}`;
			}
			throw err;
		}
	}

	close() {
		this.#postMessage(BridgeCommand.close);
	}

	#onMessage([slot, error, result]: ServiceBridgeWorkerResult) {
		const p = this.slots.release(slot);
		if (p === undefined) return;
		if (error) p.reject(new ServiceBridgeCallError(error));
		else p.resolve(result);
	}

	#postMessage<TReturn>(command: BridgeCommand, ...args: unknown[]) {
		var { promise, ...p } = Promise.withResolvers<TReturn>();
		const slot = this.slots.acquire(p);
		this.port.postMessage([slot, command, ...args]);
		return promise;
	}
}

const calleeRoot = (startAt: Function) => {
	const o: { stack?: string } = {};
	const maxStack = Error.stackTraceLimit;
	Error.stackTraceLimit = 1;
	Error.captureStackTrace(o, startAt);
	Error.stackTraceLimit = maxStack;
	const cameFrom = o.stack?.substring('Error\n'.length);
	const match = cameFrom?.match(/\((.*):\d+:\d+\)$/) || cameFrom?.match(/at (.*):\d+:\d+$/);
	const callerFile = match && match[1];
	if (!callerFile) throw new Error('Failed to determine caller path.');
	return dirname(asPath(callerFile));
};

const asPath = (urlOrPath: string) => (urlOrPath.startsWith('file://') ? fileURLToPath(urlOrPath) : urlOrPath);
