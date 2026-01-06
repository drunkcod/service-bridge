import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import { type MessagePort, Worker } from 'worker_threads';
import type { ServiceBridgeWorkerResult } from './ServiceBridge.js';
import { BridgeCommand } from './BridgeCommand.js';

const ThisFileName =
	(function getFileName() {
		const x: { stack?: string } = new Error();
		const thisMethodLine = x.stack?.split('\n')[1];
		return thisMethodLine?.match(/\((.*):\d+:\d+\)/)?.[1];
	})() ?? import.meta.filename;

export const runServiceBridgeWorker = (port: MessagePort | null) => {
	if (!port) throw new Error('Missing "port"');
	let fns: Record<string, Function> = Object.create(null);
	const reply = (result: ServiceBridgeWorkerResult) => port.postMessage(result);
	const makeFn = (fnDef: string) => Function(`return (${fnDef}).apply(this, arguments)`);

	const onConfig = (fnDef: string, basePath: string) => {
		const baseUrl = new URL(`file://${basePath}/`);
		const resolve = (relPath: string) => new URL(relPath, baseUrl).href;

		var fn = makeFn(fnDef);
		return Promise.resolve(
			fn({
				add(name: string, fn: Function) {
					fns[name] = fn;
					return name;
				},
				import(relPath: string) {
					return import(resolve(relPath));
				},
			})
		);
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
					if (err instanceof Error) {
						let stack = err.stack;
						if (stack) {
							const lines = stack.split('\n');
							const thisFile = lines.findIndex((x) => x.includes(ThisFileName));
							if (thisFile !== -1) stack = lines.slice(0, thisFile).join('\n');
						}
						reply([
							slot,
							{
								name: err.name,
								message: err.message,
								cause: err.cause,
								stack,
							},
							null,
						]);
					} else {
						reply([slot, { name: 'Error', message: String(err) }, null]);
					}
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
	import { runServiceBridgeWorker } from '@drunkcod/service-bridge';
	runServiceBridgeWorker(parentPort);
`;
export const startServiceBridgeWorker = () => new Worker(DefaultWorkerScript, { eval: true });
