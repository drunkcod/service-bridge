import type { ServiceResponse } from './ServiceResponse.js';
import { startServices } from './startServices.js';
import express from 'express';

type ServiceHandler = (...args: any[]) => Promise<ServiceResponse>;

const run = async <T extends ServiceHandler>(res: express.Response, handler: T, ...args: Parameters<T>) => {
	const { status, body } = await handler(...args);
	res.status(status).send(body);
};

(async function main() {
	const port = 8080;
	const app = express();

	var proxy = await startServices();
	console.log(proxy.services);
	const { auth, hello } = proxy.services;

	// delegate to worker
	app.get('/hello', (_, res) => run(res, hello));

	// extract parameters
	app.get('/user', (req, res) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		run(res, auth.user, authorization);
	});

	//as middleware
	const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		const { status, body } = await auth.user(authorization);
		Reflect.set(req, 'user', body);
		if (status === 200) next();
		else res.sendStatus(403);
	};

	interface UserRequest extends express.Request {
		user: { userId: string };
	}

	function assertUserRequest(req: express.Request): asserts req is UserRequest {}

	app.get('/user/hello', authMiddleware, (req, res) => {
		assertUserRequest(req);
		run(res, hello, req.user.userId);
	});

	console.log(`🚀 listening on port ${port}. Ctrl+C to quit.`);
	var server = app.listen(port);

	process.once('SIGINT', async () => {
		console.log('bye...');
		await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
		proxy.close();
		await new Promise((resolve) => process.stdout.write('', resolve));
	});
})();
