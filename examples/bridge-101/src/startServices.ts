import { type MessagePort, Worker } from 'worker_threads';
import { ServiceBridge, makeProxy, startServiceBridgeWorker } from '@drunkcod/service-bridge';

const CloseBridge: unique symbol = Symbol('closeBridge');

export const startServices = async (port?: MessagePort | Worker) => {
	const bridge = new ServiceBridge(port ?? startServiceBridgeWorker());
	var services = await bridge.config(import.meta.url, async (bridge) => {
		const math = (await bridge.import('./services/math.js')) as typeof import('./services/math.js');
		const { setTimeout } = await import('node:timers/promises');
		return {
			add: bridge.add('/math/add', math.add),
			error: bridge.add('/math/error', math.error),
			delay: bridge.add('/delay', async (delayMs: number) => await setTimeout(delayMs)),
		};
	});
	return {
		...makeProxy(services, bridge),
		[CloseBridge]() {
			bridge.close();
		},
	};
};

export const stopServices = (x: { [CloseBridge]: () => void }) => x[CloseBridge]();
