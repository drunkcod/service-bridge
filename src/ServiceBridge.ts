import type { MessagePort, Worker } from 'worker_threads';

import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

import { SlotBuffer } from './SlotBuffer.js';
import { BridgeCommand } from './BridgeCommand.js';
import { ServiceBridgeCallError } from './ServiceBridgeCallError.js';
import { startServiceBridgeWorker } from './runServiceBridgeWorker.js';
import { serviceProxy } from './ServiceProxy.js';
import { toErrorReply } from './toErrorReply.js';
import { isTransfer, transfer, type Transfer, type Transferred } from './transfer.js';
import type { ServiceBridgeProxy } from './ServiceBridgeProxy.js';
import type { AnyFn } from './types.js';

const FnRef: unique symbol = Symbol('FnRef');
export type FnRef<T extends AnyFn> = string & { [FnRef]: T };
export type FnRefMap<T> = { [P in keyof T]: T[P] extends AnyFn ? FnRef<T[P]> : T[P] extends readonly [string, AnyFn] ? FnRef<T[P][1]> : FnRefMap<T[P]> };
export type ServiceRef<T> = {
	baseUrl: string;
	services: FnRefMap<T>;
};

export type ServiceParameters<Args> = { [P in keyof Args]: Args[P] extends Transferred<infer A> ? Transfer<A> : Args[P] };
export type ServiceReturn<T> = T extends Transfer<infer R> ? R : T;
type ServiceFn<T> = T extends (...args: infer P) => infer R ? (...args: ServiceParameters<P>) => ServiceReturn<R> : never;
export type ServiceFnRef<T> = T extends FnRef<(...args: infer P) => infer R> ? FnRef<(...args: ServiceParameters<P>) => ServiceReturn<R>> : never;

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
	baseUrl: string;
	maxSlots?: number;
};

const normalizeBaseUrl = (bu: string) => {
	if (bu.startsWith('file://')) bu = fileURLToPath(bu);
	return bu.endsWith('.js') || bu.endsWith('.ts') ? dirname(bu) : bu;
};

export class ServiceBridge<ServiceRegistry = any> {
	readonly port;
	readonly slots;
	readonly baseUrl: string;

	constructor(options: ServiceBridgeOptions) {
		const port = options.port ?? startServiceBridgeWorker();
		this.port = port ?? startServiceBridgeWorker();
		this.slots = new SlotBuffer<{ resolve: (result: any) => void; reject: (reason?: any) => void }>(options.maxSlots ?? 1024);

		const bar = { ...options };
		this.baseUrl = normalizeBaseUrl(options.baseUrl ?? bar.baseUrl);

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

	//connect additional port(s).
	connect(port: MessagePort) {
		this.#postMessage(BridgeCommand.connect, transfer(port));
	}

	rebind(port: MessagePort) {
		return new ServiceBridge<ServiceRegistry>({ port, baseUrl: this.baseUrl });
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
			for (let t = 2; t < msg.length; ++t) {
				const o = msg[t];
				if (!isTransfer(o)) continue;

				transferList ??= [];
				msg[t] = o.value;
				if (o.list) transferList.push(...o.list);
				else transferList.push(o.value);
			}
			this.port.postMessage(msg, transferList);
		} catch (err) {
			this.#onMessage([slot, toErrorReply(err), null]);
		}
		return promise;
	}
}

export const serviceBridgeBuilder = <ServiceRegistry>() => ({
	async createProxy<T extends Parameters<ServiceBridge<ServiceRegistry>['register']>[0]>(register: T, options: ServiceBridgeOptions) {
		const makeProxy = (bridge: ServiceBridge<ServiceRegistry>, services: Awaited<ReturnType<T>>): ServiceBridgeProxy<ServiceRegistry, T> => ({
			services: serviceProxy(bridge, services),
			addPort() {
				const { port1, port2 } = new MessageChannel();
				bridge.connect(port2);
				return port1;
			},
			close() {
				bridge.close();
			},
			connect(port: MessagePort) {
				bridge.connect(port);
			},
			rebind(port: MessagePort): typeof this {
				return makeProxy(bridge.rebind(port), services);
			},
			serviceRef() {
				return {
					baseUrl: bridge.baseUrl,
					services,
				};
			},
			transfer() {
				const port = this.addPort();
				return transfer({ port, ...this.serviceRef() }, [port]);
			},
		});
		const bridge = new ServiceBridge<ServiceRegistry>(options);
		const services = await bridge.register(register);
		return makeProxy(bridge, services);
	},
});
