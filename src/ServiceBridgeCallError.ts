import type { ServiceBridgeWorkerErrorReply } from './ServiceBridge.js';

export class ServiceBridgeCallError extends Error {
	constructor(reply: ServiceBridgeWorkerErrorReply) {
		super(reply.message, reply.cause ? { cause: reply.cause } : undefined);
		this.name = reply.name;
		if (reply.stack) this.stack = reply.stack;
	}
}
