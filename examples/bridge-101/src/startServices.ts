import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/math.js': typeof import('./services/math.js');
};

export const startServices = (port?: MessagePort | Worker) =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const math = await bridge.import('./services/math.js');
			const { setTimeout } = await import('node:timers/promises');
			return {
				add: bridge.add('/math/add', math.add),
				error: bridge.add('/math/error', math.error),
				delay: bridge.add('/delay', async (delayMs: number) => await setTimeout(delayMs)),
				echo: bridge.add('/echo', (x: unknown) => x),
			};
		},
		{ port, baseUrl: import.meta.url }
	);
