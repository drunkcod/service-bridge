import type { ServiceMap, Transferred } from '@drunkcod/service-bridge';
import { MessagePort } from 'worker_threads';
import winston from 'winston';
import { MessagePortTransport } from './MessagePortTransport.js';

const createLogger = (transport: winston.transport) =>
	winston.createLogger({
		transports: [transport],
	});

const transport = new MessagePortTransport();
const log = createLogger(transport);

export const startService = () =>
	({
		configure: [
			'/configure',
			(port: Transferred<MessagePort>) => {
				transport.connect(port);
			},
		],
		hello: [
			'/hello',
			() => {
				log.info(`hello ${transport.connected ? 'connected' : 'disconnected'} log world.`, { connected: transport.connected });
			},
		],
	} satisfies ServiceMap);
