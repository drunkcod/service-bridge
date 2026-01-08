export type ServiceResponse<Status extends number = number, TBody = unknown> = { status: Status; body: TBody };

// Helper to ensure consistent object shape (Monad-like) for V8 hidden classes
const createResponse = <Status extends number>(status: Status, description: string, body?: any) => ({
	status,
	body: body === undefined ? description : body,
});

interface ServiceResponseBuilder {
	// 2xx Success
	ok(): ServiceResponse<200, string>;
	ok<T>(body: T): ServiceResponse<200, T>;

	// 4xx Client Error
	badRequest(): ServiceResponse<400, string>;
	badRequest<T>(body: T): ServiceResponse<400, T>;

	unauthorized(): ServiceResponse<401, string>;
	unauthorized<T>(body: T): ServiceResponse<401, T>;

	// 5xx Server Error
	error(): ServiceResponse<500, string>; // 500
	error<T>(body: T): ServiceResponse<500, T>;
}

export const ServiceResponse: ServiceResponseBuilder = {
	// 2xx Success
	ok(body?: any) {
		return createResponse(200, 'Ok', body);
	},

	// 4xx Client Error
	badRequest(body?: any) {
		return createResponse(400, 'Bad Request', body);
	},
	unauthorized(body?: any) {
		return createResponse(401, 'Unauthorized', body);
	},

	// 5xx Server Error
	error(body?: any) {
		return createResponse(500, 'Internal Server Error', body);
	},
};
