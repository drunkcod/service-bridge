import { type MessagePort, Worker } from 'worker_threads';
import { serviceBridgeBuilder, type Transferred, type ServiceRef, type TransferredService } from '@drunkcod/service-bridge';

type ServiceRegistry = {
	'./services/math.js': typeof import('./services/math.js');
};

export const startServices = () =>
	serviceBridgeBuilder<ServiceRegistry>().createProxy(
		async (bridge) => {
			const math = await bridge.import('./services/math.js');
			const { setTimeout } = await import('node:timers/promises');
			const { ServiceBridge, serviceProxy, transfer } = await import('@drunkcod/service-bridge');

			return {
				add: bridge.add('/math/add', math.add),
				error: bridge.add('/math/error', math.error),
				delay: bridge.add('/delay', async (delayMs: number) => await setTimeout(delayMs)),
				echo: bridge.add('/echo', (x: unknown) => x),
				badReply: bridge.add('/badReply', () => {
					throw new Error('Bad reply.', { cause: Symbol('bad-reply') });
				}),
				transfer: bridge.add('/transfer', (port: Transferred<MessagePort>) => {
					port.postMessage('hello from the other side!');
				}),
				transferReply: bridge.add('/transferReply', () => {
					const bytes = new ArrayBuffer(1024);
					return transfer({ bytes }, [bytes]);
				}),
				transferProxy: bridge.add('/transferProxy', async (math: TransferredService<{ add(x: number, y: number): number }>) => {
					var bridge = new ServiceBridge({ port: math.port, baseUrl: math.baseUrl });
					var { add } = serviceProxy(bridge, math.services);
					try {
						return await add(10, 7);
					} finally {
						bridge.close();
					}
				}),
			};
		},
		{ baseUrl: import.meta.url }
	);
