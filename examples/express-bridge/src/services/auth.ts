import { ServiceResponse } from '../ServiceResponse.js';

import jwt from 'jsonwebtoken';
const { JsonWebTokenError, verify } = jwt;

const secret = 'AUTH_SECRET';

export const user = (authorization: string) => {
	const [bearer, token] = authorization.split(' ');
	if (bearer !== 'Bearer') return ServiceResponse.badRequest('Missing or malformed token.');
	try {
		const data = verify(token, secret);
		return ServiceResponse.ok(data);
	} catch (error) {
		if (error instanceof JsonWebTokenError) {
			return ServiceResponse.unauthorized(error.message);
		}
		return ServiceResponse.error(String(error));
	}
};
