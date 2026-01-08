import { type MessagePort, Worker } from 'worker_threads';
import type { AnyFn, FnRef, ServiceBridgeBuilder, ServiceBridgeWorkerResult, Strings } from './ServiceBridge.js';
import { BridgeCommand } from './BridgeCommand.js';
import { toErrorReply } from './toErrorReply.js';

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
			this.fns[nameOrMap] = fn!;
			return nameOrMap;
		}
		const r: Record<string, string> = {};
		for (const [name, x] of Object.entries(nameOrMap)) {
			r[name] = x[0];
			this.fns[x[0]] = x[1];
		}
		return r;
	}
	import(relPath: string) {
		return import(new URL(relPath, this.baseUrl).href);
	}
}

export const runServiceBridgeWorker = (port: MessagePort | null) => {
	if (!port) throw new Error('Missing "port"');
	let fns: Record<string, Function> = Object.create(null);
	const reply = (result: ServiceBridgeWorkerResult) => {
		try {
			port.postMessage(result);
		} catch (err) {
			port.postMessage([result[0], toErrorReply(err), null]);
		}
	};
	const makeFn = (fnDef: string) => Function(`return (${fnDef}).apply(this, arguments)`);

	const onConfig = (fnDef: string, basePath: string) => {
		var fn = makeFn(fnDef);
		return Promise.resolve(fn(new WorkerBridgeBuilder(new URL(`file://${basePath}/`), fns)));
	};

	port.on('message', async function onMessage(data: unknown[]) {
		const slot = data.shift() as bigint,
			method = data.shift() as BridgeCommand;

		if (method === BridgeCommand.call) {
			const fnName = data.shift() as string;
			const fn = fns[fnName];
			if (fn) {
				try {
					const r = await Promise.resolve(fn(...data));
					reply([slot, null, r]);
				} catch (err) {
					reply([slot, toErrorReply(err), null]);
				}
			} else {
				reply([slot, { name: 'MissingFunctionError', message: 'No such function', cause: fnName }, null]);
			}
		} else {
			switch (method) {
				case BridgeCommand.config:
					const args = data as [string, string];
					reply([slot, null, await onConfig(args[0], args[1])]);
					break;
				case BridgeCommand.close: {
					fns = Object.create(null);
					reply([slot, null, null]);
					port.close();
					break;
				}
			}
		}
	});
};

const DefaultWorkerScript = `
	import { parentPort } from 'node:worker_threads';
	import { runServiceBridgeWorker } from '@drunkcod/service-bridge/worker';
	runServiceBridgeWorker(parentPort);
`;
export const startServiceBridgeWorker = () => new Worker(DefaultWorkerScript, { eval: true });
