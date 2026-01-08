import type { ServiceResponse } from './ServiceResponse.js';
import { startServices } from './startServices.js';
import express from 'express';

type ServiceHandler = (...args: any[]) => Promise<ServiceResponse>;

const run = async <T extends ServiceHandler>(res: express.Response, handler: T, ...args: Parameters<T>) => {
	const { status, body } = await handler(...args);
	res.status(status).send(body);
};

type UserInfo = { userId: string };

declare global {
	namespace Express {
		interface Request {
			user?: UserInfo;
		}
	}
}

function ensureAuthenticated(req: express.Request): asserts req is express.Request & { user: UserInfo } {
	if (!req.user) throw new Error('Not authenticated.');
}

(async function main() {
	const port = 8080;
	const app = express();

	var proxy = await startServices();
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
			res.sendStatus(400);
			return;
		}
		const user = await auth.user(authorization);
		if (user.status === 200) {
			req.user = user.body;
			next();
		} else res.status(user.status).send(user.status);
	};

	app.get('/user/hello', authMiddleware, (req, res) => {
		ensureAuthenticated(req);
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
