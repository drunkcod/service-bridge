import { startServices } from './startServices.js';
import { transfer } from '@drunkcod/service-bridge';

import winston from 'winston';
import { MESSAGE, LEVEL } from 'triple-beam';
import { forwardLogMessages, type LogMessage } from './services/MessagePortTransport.js';

(async function main() {
	var log = winston.createLogger({
		transports: [new winston.transports.Console()],
	});
	var proxy = await startServices();
	const { configure, hello } = proxy.services.myService;
	log.info('hello winston world.');
	const c = new MessageChannel();
	forwardLogMessages(c.port1, log.transports);
	await hello();
	await configure(transfer(c.port2));
	await hello();
	proxy.close();
})();
