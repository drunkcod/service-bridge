import type { ServiceMap, ServiceProxy, Transferred } from '@drunkcod/service-bridge';
import type { MessagePort } from 'worker_threads';

import winston from 'winston';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';
const { JsonWebTokenError, verify, sign } = jwt;
import z from 'zod';

import { ServiceResponse } from '../ServiceResponse.js';

import { MessagePortTransport } from '../MessagePortTransport.js';
import { loggerFormat } from '../loggerFormat.js';

const secret = 'AUTH_SECRET';

const UserInfoSchema = z.object({
	id: z.number(),
	username: z.string(),
	name: z.string(),
	role: z.enum(['admin', 'guest']),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

const logTransport = new MessagePortTransport();
const log = winston.createLogger({ transports: [logTransport], format: loggerFormat });

const users: { info: UserInfo; password: string }[] = [];
const userLookup: Record<string, number> = Object.create(null);

const addUser = (item: { username: string; password: string; name?: string; role: UserInfo['role'] }) => {
	userLookup[item.username] = users.length;
	const user = {
		info: { id: users.length + 1, username: item.username, name: item.name ?? item.username, role: item.role } satisfies UserInfo,
		password: bcrypt.hashSync(item.password, 12),
	};
	users.push(user);
	return user;
};

addUser({ username: 'admin', password: '123456', name: 'Joe Admin', role: 'admin' });

export const login = (username: string, password: string) => {
	log.info('login', { users, userLookup });
	const found = userLookup[username];
	const user = found !== undefined ? users[found] : addUser({ username, password, role: 'guest' });

	if (bcrypt.compareSync(password, user.password)) return ServiceResponse.ok({ token: sign(user.info, secret) });

	return ServiceResponse.unauthorized('Invalid username or password.');
};

export const user = (authorization: string) => {
	const [bearer, token] = authorization.split(' ');
	if (bearer !== 'Bearer') return ServiceResponse.badRequest('Missing or malformed token.');
	try {
		const data = verify(token, secret);
		var user = UserInfoSchema.parse(data);
		log.info(`User ${user.id} authenticated`, user);
		return ServiceResponse.ok({ user });
	} catch (error) {
		if (error instanceof JsonWebTokenError) {
			return ServiceResponse.unauthorized(error.message);
		}
		return ServiceResponse.error(String(error));
	}
};

export const startService = () =>
	({
		login: ['/auth/login', login],
		getUser: ['/auth/user', user],
		configure: [
			'/auth/configure',
			(logPort: Transferred<MessagePort>) => {
				logTransport.connect(logPort);
			},
		],
	} satisfies ServiceMap);

export type AuthServiceMap = ReturnType<typeof startService>;
