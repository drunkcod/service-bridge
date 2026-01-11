import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { transfer } from '@drunkcod/service-bridge';

import { startAuth, startHello } from './startServices.js';
import { toExpress } from './expressAdapter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

import winston from 'winston';
import { createLogPort } from './MessagePortTransport.js';
import { loggerFormat } from './loggerFormat.js';
import type { UserInfo } from './services/auth.js';

(async function main() {
	const port = 8080;

	const log = winston.createLogger({
		transports: [new winston.transports.Console()],
		format: loggerFormat,
	});

	const app = express();
	app.use(express.static(join(__dirname, '../public')));

	const authService = await startAuth();
	const auth = authService.services;
	auth.configure(transfer(createLogPort(log.transports)));

	var helloService = await startHello();
	const hello = helloService.services;
	// 🔗 Connect services directly to each other.
	// This allows 'hello' to talk to 'auth' without going through the main thread.
	// The main thread is only used to set up the connection.
	hello.configure(authService.transfer(), transfer(createLogPort(log.transports)));

	// delegate to worker
	app.get('/hello', async (_, res) => await toExpress(res, hello.hello));

	// extract parameters
	app.get('/user', async (req, res) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		await toExpress(res, auth.getUser, authorization);
	});

	app.post('/login', express.json(), async (req, res) => {
		return await toExpress(res, auth.login, req.body.username, req.body.password);
	});

	//as middleware
	const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(400);
			return;
		}
		const user = await auth.getUser(authorization);
		if (user.status === 200) {
			req.user = user.body.user;
			next();
		} else res.status(user.status).send(user.status);
	};

	app.get('/user/hello', authMiddleware, async (req, res) => {
		ensureAuthenticated(req);
		await toExpress(res, hello.hello, req.user.id.toString());
	});

	// cross service calls
	app.get('/hello/auth', async (req, res) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			res.sendStatus(403);
			return;
		}
		await toExpress(res, hello.helloAuth, authorization);
	});
	log.info(`🚀 listening on port ${port}. Ctrl+C to quit.`);
	var server = app.listen(port);

	process.once('SIGINT', async () => {
		console.log('bye...');
		await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
		helloService.close();
		authService.close();
		await new Promise((resolve) => process.stdout.write('', resolve));
	});
})();
