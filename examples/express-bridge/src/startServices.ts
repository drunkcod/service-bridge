import { type MessagePort, Worker } from 'worker_threads';
import { ServiceBridge, makeProxy, startServiceBridgeWorker } from '@drunkcod/service-bridge';

const CloseBridge: unique symbol = Symbol('closeBridge');

export const startServices = async (port?: MessagePort | Worker) => {
	const bridge = new ServiceBridge(port ?? 'worker');
	var services = await bridge.config(import.meta.url, async (bridge) => {
		const { hello } = (await bridge.import('./services/hello.js')) as typeof import('./services/hello.js');
		const { user } = (await bridge.import('./services/auth.js')) as typeof import('./services/auth.js');

		return {
			hello: bridge.add('/hello', hello),
			user: bridge.add('/auth/user', user),
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
