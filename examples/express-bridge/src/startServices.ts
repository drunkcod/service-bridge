import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/auth.js': typeof import('./services/auth.js');
	'./services/hello.js': typeof import('./services/hello.js');
};

export const startAuth = (port?: MessagePort | Worker) =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const auth = await bridge.import('./services/auth.js');
			return bridge.add(auth.startService());
		},
		{ port, baseUrl: import.meta.url }
	);

export const startHello = (port?: MessagePort | Worker) =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const hello = await bridge.import('./services/hello.js');
			return bridge.add(hello.startService());
		},
		{ port, baseUrl: import.meta.url }
	);
