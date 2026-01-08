import type { MessagePort, Worker } from 'worker_threads';

import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

import { SlotBuffer } from './SlotBuffer.js';
import { BridgeCommand } from './BridgeCommand.js';
import { ServiceBridgeCallError } from './ServiceBridgeCallError.js';
import { startServiceBridgeWorker } from './runServiceBridgeWorker.js';
import { serviceProxy } from './ServiceProxy.js';
import { toErrorReply } from './toErrorReply.js';

export type AnyFn = (...args: any[]) => any;

const FnRef: unique symbol = Symbol('FnRef');
export type FnRef<T extends AnyFn> = string & { [FnRef]: T };

const Transfer: unique symbol = Symbol('Transfer');
export type Transfer<T> = { [Transfer]: true; readonly value: T };
export type Transferred<T> = T & { [Transfer]: false };
export const transfer = <T>(value: T) => ({ [Transfer]: true, value } as const);

function isTransfer(x: unknown): x is Transfer<unknown> {
	return !!x && typeof x === 'object' && Transfer in x;
}

type ServiceParameters<Args> = { [P in keyof Args]: Args[P] extends Transferred<infer A> ? Transfer<A> : Args[P] };
type ServiceFn<T> = T extends (...args: infer P) => infer R ? (...args: ServiceParameters<P>) => R : never;

export type ServiceBridgeWorkerErrorReply = { name: string; message: string; cause?: unknown; stack?: string };

export type ServiceBridgeWorkerResult = [bigint, null, unknown] | [bigint, ServiceBridgeWorkerErrorReply, null];

type AnyToUnknown<T> = 0 extends false & T ? unknown : T;
export type Strings<T> = T extends string ? T : never;
export type ServiceMap = Record<string, readonly [string, AnyFn]>;

export interface ServiceBridgeBuilder<ServiceRegistry> {
	add<T extends AnyFn>(method: string, fn: T): FnRef<ServiceFn<T>>;
	add<T extends ServiceMap>(methods: T): { [P in Strings<keyof T>]: FnRef<ServiceFn<T[P][1]>> };
	import<T extends Strings<keyof ServiceRegistry>>(relPath: T): Promise<AnyToUnknown<ServiceRegistry[T]>>;
}

export type ServiceBridgeRegisterFn<T, ServiceRegistry = any> = (bridge: ServiceBridgeBuilder<ServiceRegistry>) => T;

type WorkerPort = MessagePort | Worker;

type ServiceBridgeOptions = {
	port?: WorkerPort;
	baseUrl?: string;
	maxSlots?: number;
};

export class ServiceBridge<ServiceRegistry = any> {
	readonly port;
	readonly slots;
	readonly baseUrl: string;

	constructor(options?: ServiceBridgeOptions) {
		const port = options?.port ?? startServiceBridgeWorker();
		this.port = port ?? startServiceBridgeWorker();
		this.slots = new SlotBuffer<{ resolve: (result: any) => void; reject: (reason?: any) => void }>(options?.maxSlots ?? 1024);

		let baseUrl = options?.baseUrl ?? calleeRoot(ServiceBridge.prototype.register);
		if (baseUrl.startsWith('file://')) baseUrl = fileURLToPath(baseUrl);
		this.baseUrl = baseUrl.endsWith('.js') || baseUrl.endsWith('.ts') ? dirname(baseUrl) : baseUrl;

		port.on('message', (message) => this.#onMessage(message));
	}

	register<T extends ServiceBridgeRegisterFn<ReturnType<T>, ServiceRegistry>>(fn: T): Promise<ReturnType<T>> {
		return this.#postMessage(BridgeCommand.config, fn.toString(), [this.baseUrl]);
	}

	call<T extends AnyFn>(fn: FnRef<T>, ...args: Parameters<T>): Promise<ReturnType<T>>;
	call(fn: string, ...args: unknown[]): Promise<unknown>;
	async call(fn: string, ...args: unknown[]): Promise<unknown> {
		try {
			return await this.#postMessage(BridgeCommand.call, fn, args);
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

	#postMessage<TReturn>(command: BridgeCommand, arg0?: unknown, args?: unknown[]) {
		const { promise, ...p } = Promise.withResolvers<TReturn>();
		const slot = this.slots.acquire(p);
		const msg: [bigint, BridgeCommand, ...unknown[]] = [slot, command];
		if (arg0) msg.push(arg0);
		if (args) msg.push(...args);
		try {
			let transferList: undefined | any[];

			for (let t = 3; t < msg.length; ++t) {
				const o = msg[t];
				if (isTransfer(o)) {
					var value = (msg[t] = o.value);
					if (!transferList) transferList = [value];
					else transferList.push(value);
				}
			}
			this.port.postMessage(msg, transferList);
		} catch (err) {
			this.#onMessage([slot, toErrorReply(err), null]);
		}
		return promise;
	}
}

export const serviceBridgeBuilder = <ServiceRegistry>() => ({
	async createProxy<T extends Parameters<ServiceBridge<ServiceRegistry>['register']>[0]>(register: T, options?: ServiceBridgeOptions) {
		const bridge = new ServiceBridge<ServiceRegistry>(options);
		const services = await bridge.register(register);
		return {
			services: serviceProxy(bridge, services),
			close() {
				bridge.close();
			},
		};
	},
});

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
