import type { MessagePort } from 'worker_threads';
import { LEVEL, MESSAGE } from 'triple-beam';

import winston from 'winston';
import Transport from 'winston-transport';

export type LogMessage = { LEVEL: string; MESSAGE: string };

export class MessagePortTransport extends Transport {
	port?: MessagePort;
	buffer?: LogMessage[];

	constructor(port?: MessagePort) {
		super();
		if (port) this.connect(port);
	}

	get connected() {
		return !!this.port;
	}

	connect(port: MessagePort) {
		this.port = port;
		this.#flush();
	}

	#flush() {
		const { port, buffer } = this;
		if (!buffer || !port) return;
		buffer.forEach((x) => port.postMessage(x));
		this.buffer = undefined;
	}

	override log(info: any, callback: () => void) {
		const m = { LEVEL: info[LEVEL], MESSAGE: info[MESSAGE] };
		if (this.port) this.port.postMessage(m);
		else (this.buffer ??= []).push(m);

		callback();
	}
}

const nop = function () {};
export const forwardLogMessages = (port: MessagePort, transports: winston.transport[]) => {
	port.on('message', (message: LogMessage) => {
		transports.forEach((transport) =>
			transport.log!(
				{
					[LEVEL]: message.LEVEL,
					[MESSAGE]: message.MESSAGE,
				},
				nop
			)
		);
	});
};

export const createLogPort = (transports: winston.transport[]) => {
	const { port1, port2 } = new MessageChannel();
	forwardLogMessages(port2, transports);
	return port1;
};
