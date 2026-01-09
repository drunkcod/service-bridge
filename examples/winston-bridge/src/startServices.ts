import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder, type Transferred } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/my-service.js': typeof import('./services/my-service.js');
};

export const startServices = (port?: MessagePort | Worker) =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const { startService } = await bridge.import('./services/my-service.js');

			return { myService: bridge.add(startService()) };
		},
		{ port, baseUrl: import.meta.url }
	);
