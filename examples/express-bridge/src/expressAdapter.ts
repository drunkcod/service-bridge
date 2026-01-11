import type { Response } from 'express';
import type { ServiceResponse } from './ServiceResponse.js';

type ServiceHandler = (...args: any[]) => Promise<ServiceResponse>;

/**
 * Adapts a ServiceBridge handler to an Express response.
 * Unwraps the ServiceResponse and applies the status code and body to the Express response.
 */
export const toExpress = async <T extends ServiceHandler>(res: Response, handler: T, ...args: Parameters<T>) => {
	try {
		const { status, body } = await handler(...args);
		res.status(status).send(body);
	} catch (err) {
		// In a real app, you'd probably want to log this error
		console.error('Service Adapter Error:', err);
		res.status(500).send({ error: 'Internal Service Error' });
	}
};
