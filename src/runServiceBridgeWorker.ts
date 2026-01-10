import { type MessagePort, type Transferable, Worker } from 'worker_threads';
import type { AnyFn, FnRef, ServiceBridgeBuilder, ServiceBridgeWorkerResult, Strings } from './ServiceBridge.js';
import { BridgeCommand } from './BridgeCommand.js';
import { toErrorReply } from './toErrorReply.js';
import { isTransfer } from './transfer.js';

export const ThisFileName =
	(function getFileName() {
		const x: { stack?: string } = new Error();
		const thisMethodLine = x.stack?.split('\n')[1];
		return thisMethodLine?.match(/\((.*):\d+:\d+\)/)?.[1];
	})() ?? import.meta.filename;

class WorkerBridgeBuilder implements ServiceBridgeBuilder<any> {
	constructor(private readonly baseUrl: URL, private readonly fns: Record<string, Function>) {}

	add<T extends AnyFn>(method: string, fn: T): FnRef<T>;
	add<T extends Record<string, [string, AnyFn]>>(methods: T): { [P in Strings<keyof T>]: FnRef<T[P][1]> };
	add(nameOrMap: string | Record<string, [string, Function]>, fn?: Function) {
		if (typeof nameOrMap === 'string') {
			this.#add(nameOrMap, fn!);
			return nameOrMap;
		}
		const r: Record<string, string> = {};
		for (const [name, x] of Object.entries(nameOrMap)) {
			r[name] = x[0];
			this.#add(x[0], x[1]);
		}
		return r;
	}

	#add(key: string, fn: Function) {
		if (key in this.fns) throw new Error(`Duplicate function identifier "${key}".`);
		this.fns[key] = fn;
	}

	import(relPath: string) {
		return import(new URL(relPath, this.baseUrl).href);
	}
}

const makeFn = (fnDef: string) => Function(`return (${fnDef}).apply(this, arguments)`);

const reply = (port: MessagePort, result: ServiceBridgeWorkerResult, transferList?: Transferable[]) => {
	try {
		port.postMessage(result, transferList);
	} catch (err) {
		port.postMessage([result[0], toErrorReply(err), null]);
	}
};

export const runServiceBridgeWorker = (port: MessagePort | null) => {
	if (!port) throw new Error('Missing "port"');

	let fns: Record<string, Function> = Object.create(null);

	const onConfig = (fnDef: string, basePath: string) => {
		var fn = makeFn(fnDef);
		return Promise.resolve(fn(new WorkerBridgeBuilder(new URL(`file://${basePath}/`), fns)));
	};

	async function onMessage(this: MessagePort, data: unknown[]) {
		const slot = data.shift() as bigint,
			method = data.shift() as BridgeCommand;

		if (method === BridgeCommand.call) {
			const fnName = data.shift() as string;
			const fn = fns[fnName];
			if (fn) {
				try {
					const r = await Promise.resolve(fn(...data));
					if (isTransfer(r)) reply(this, [slot, null, r.value], r.list);
					else reply(this, [slot, null, r]);
				} catch (err) {
					reply(this, [slot, toErrorReply(err), null]);
				}
			} else {
				reply(this, [slot, { name: 'MissingFunctionError', message: 'No such function', cause: fnName }, null]);
			}
		} else {
			switch (method) {
				case BridgeCommand.config:
					const args = data as [string, string];
					reply(this, [slot, null, await onConfig(args[0], args[1])]);
					break;
				case BridgeCommand.close: {
					fns = Object.create(null);
					reply(this, [slot, null, null]);
					this.close();
					break;
				}
				case BridgeCommand.connect: {
					const port = data[0] as MessagePort;
					port.on('message', onMessage);
					break;
				}
			}
		}
	}

	port.on('message', onMessage);
};

const DefaultWorkerScript = `
	import { parentPort } from 'node:worker_threads';
	import { runServiceBridgeWorker } from '@drunkcod/service-bridge/worker';
	runServiceBridgeWorker(parentPort);
`;
export const startServiceBridgeWorker = () => new Worker(DefaultWorkerScript, { eval: true });
