import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/auth.js': typeof import('./services/auth.js');
	'./services/hello.js': typeof import('./services/hello.js');
};

export const startAuth = () =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const auth = await bridge.import('./services/auth.js');
			return bridge.add(auth.startService());
		},
		{ baseUrl: import.meta.url }
	);

export const startHello = () =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const hello = await bridge.import('./services/hello.js');
			return bridge.add(hello.startService());
		},
		{ baseUrl: import.meta.url }
	);
