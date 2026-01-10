import type { MessagePort } from 'worker_threads';
import type { ServiceBridge } from './ServiceBridge.js';
import type { ServiceProxy } from './ServiceProxy.js';
import type { Transfer } from './transfer.js';

export interface ServiceBridgeProxy<ServiceRegistry, T extends Parameters<ServiceBridge<ServiceRegistry>['register']>[0]> {
	services: ServiceProxy<Awaited<ReturnType<T>>>;
	addPort(): MessagePort;
	close(): void;
	connect(port: MessagePort): void;
	rebind(port: MessagePort): ServiceBridgeProxy<ServiceRegistry, T>;
	serviceRef(): { baseUrl: string; services: Awaited<ReturnType<T>> };
	transfer(): Transfer<{ baseUrl: string; services: Awaited<ReturnType<T>>; port: MessagePort }>;
}
