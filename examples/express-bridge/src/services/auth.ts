import type { ServiceMap } from '@drunkcod/service-bridge';
import { ServiceResponse } from '../ServiceResponse.js';

import jwt from 'jsonwebtoken';
const { JsonWebTokenError, verify } = jwt;
import z from 'zod';

const secret = 'AUTH_SECRET';

const UserInfoSchema = z.object({
	userId: z.string(),
});

export const user = (authorization: string) => {
	const [bearer, token] = authorization.split(' ');
	if (bearer !== 'Bearer') return ServiceResponse.badRequest('Missing or malformed token.');
	try {
		const data = verify(token, secret);
		return ServiceResponse.ok(UserInfoSchema.parse(data));
	} catch (error) {
		if (error instanceof JsonWebTokenError) {
			return ServiceResponse.unauthorized(error.message);
		}
		return ServiceResponse.error(String(error));
	}
};

export const startService = (): ServiceMap => ({
	getUser: ['/auth/user', user],
});
