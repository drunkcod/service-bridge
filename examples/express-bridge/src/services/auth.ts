import type { HttpResponse } from './../HttpResponse.js';

import jwt from 'jsonwebtoken';
const { JsonWebTokenError, verify } = jwt;

const secret = 'AUTH_SECRET';

export const user = (authorization: string): HttpResponse => {
	const [bearer, token] = authorization.split(' ');
	if (bearer !== 'Bearer') return { status: 403, body: 'Invalid token!' };
	try {
		const data = verify(token, secret);
		return { status: 200, body: data };
	} catch (error) {
		if (error instanceof JsonWebTokenError) {
			return { status: 403, body: error.message };
		}
		return { status: 500, body: String(error) };
	}
};
