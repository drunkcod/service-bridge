import type { HttpResponse } from './HttpResponse.js';
import { startServices, stopServices } from './startServices.js';
import express from 'express';

type HttpHandler = (...args: any[]) => Promise<HttpResponse>;

const run = async <T extends HttpHandler>(res: express.Response, handler: T, ...args: Parameters<T>) => {
	const { status, body } = await handler(...args);
	res.status(status).send(body);
};

(async function main() {
	const port = 8080;
	const app = express();

	var services = await startServices();

	// delegate to worker
	app.get('/hello', (_, res) => run(res, services.hello));

	// extract parameters
	app.get('/user', (req, res) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		run(res, services.user, authorization);
	});

	//as middleware
	const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		const { status } = await services.user(authorization);
		if (status === 200) next();
		else res.sendStatus(403);
	};
	app.get('/user/hello', authMiddleware, (_, res) => run(res, services.hello));

	console.log(`🚀 listening on port ${port}. Ctrl+C to quit.`);
	var server = app.listen(port);

	process.once('SIGINT', async () => {
		console.log('bye...');
		await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
		stopServices(services);
		await new Promise((resolve) => process.stdout.write('', resolve));
	});
})();
