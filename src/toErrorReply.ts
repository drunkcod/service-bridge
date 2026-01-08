import { ThisFileName } from './runServiceBridgeWorker.js';
import type { ServiceBridgeWorkerErrorReply } from './ServiceBridge.js';

export const toErrorReply = (err: unknown): ServiceBridgeWorkerErrorReply => {
	if (err instanceof Error) {
		let stack = err.stack;
		if (stack) {
			const lines = stack.split('\n');
			const thisFile = lines.findIndex((x) => x.includes(ThisFileName));
			if (thisFile !== -1) stack = lines.slice(0, thisFile).join('\n');
		}

		return {
			name: err.name,
			message: err.message,
			cause: err.cause,
			stack,
		};
	} else {
		return { name: 'Error', message: String(err) };
	}
};
