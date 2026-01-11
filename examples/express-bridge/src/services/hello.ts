import { type Async, type ServiceMap, type Transferred, type ServiceRef, ServiceBridge, serviceProxy, type TransferredService } from '@drunkcod/service-bridge';
import type { MessagePort } from 'worker_threads';
import { ServiceResponse } from '../ServiceResponse.js';

import winston from 'winston';
import { MessagePortTransport } from '../MessagePortTransport.js';
import { loggerFormat } from '../loggerFormat.js';

import { user } from './auth.js';

import type { AuthServiceMap } from './auth.js';

let getUser: Async<typeof user> = function () {
	throw new Error('Service not configured.');
};

const logTransport = new MessagePortTransport();
const log = winston.createLogger({ transports: [logTransport], format: loggerFormat });

export const hello = (name?: string) => ServiceResponse.ok(`hello ${name ?? 'express bridge'}`);
export const helloAuth = async (token: string) => {
	log.info('hello, authenticating via token', { token });
	const user = await getUser(token);
	if (user.status != 200) return user;
	log.info('user authenticated successfully.', { user });
	return ServiceResponse.ok(`hello ${user.body.user.name}.`);
};

export const startService = () =>
	({
		configure: [
			'/hello/configure',
			async (auth: TransferredService<AuthServiceMap>, logPort: Transferred<MessagePort>) => {
				const bridge = new ServiceBridge({ port: auth.port, baseUrl: auth.baseUrl });
				const proxy = serviceProxy(bridge, auth.services);
				getUser = proxy.getUser;

				logTransport.connect(logPort);
			},
		],
		hello: ['/hello', hello],
		helloAuth: ['/hello/auth', helloAuth],
	} satisfies ServiceMap);
