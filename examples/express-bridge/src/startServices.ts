import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/auth.js': typeof import('./services/auth.js');
	'./services/hello.js': typeof import('./services/hello.js');
};

export const startServices = (port?: MessagePort | Worker) =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const auth = await bridge.import('./services/auth.js');
			const { hello } = await bridge.import('./services/hello.js');

			return {
				auth: bridge.add(auth.startService()),
				hello: bridge.add('/hello', hello),
			};
		},
		{ port, baseUrl: import.meta.url }
	);
