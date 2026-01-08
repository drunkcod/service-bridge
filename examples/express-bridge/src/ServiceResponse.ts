export type ServiceResponse<TBody = unknown> = { status: number; body: TBody };

// Helper to ensure consistent object shape (Monad-like) for V8 hidden classes
const createResponse = (status: number, description: string, body?: any) => ({
	status,
	body: body === undefined ? description : body,
});

interface ServiceResponseBuilder {
	// 1xx Informational
	continue(): ServiceResponse<string>;
	continue<T>(body: T): ServiceResponse<T>;

	switchingProtocols(): ServiceResponse<string>;
	switchingProtocols<T>(body: T): ServiceResponse<T>;

	processing(): ServiceResponse<string>;
	processing<T>(body: T): ServiceResponse<T>;

	earlyHints(): ServiceResponse<string>;
	earlyHints<T>(body: T): ServiceResponse<T>;

	// 2xx Success
	ok(): ServiceResponse<string>;
	ok<T>(body: T): ServiceResponse<T>;

	created(): ServiceResponse<string>;
	created<T>(body: T): ServiceResponse<T>;

	accepted(): ServiceResponse<string>;
	accepted<T>(body: T): ServiceResponse<T>;

	nonAuthoritativeInformation(): ServiceResponse<string>;
	nonAuthoritativeInformation<T>(body: T): ServiceResponse<T>;

	noContent(): ServiceResponse<string>;
	noContent<T>(body: T): ServiceResponse<T>;

	resetContent(): ServiceResponse<string>;
	resetContent<T>(body: T): ServiceResponse<T>;

	partialContent(): ServiceResponse<string>;
	partialContent<T>(body: T): ServiceResponse<T>;

	multiStatus(): ServiceResponse<string>;
	multiStatus<T>(body: T): ServiceResponse<T>;

	alreadyReported(): ServiceResponse<string>;
	alreadyReported<T>(body: T): ServiceResponse<T>;

	imUsed(): ServiceResponse<string>;
	imUsed<T>(body: T): ServiceResponse<T>;

	// 3xx Redirection
	multipleChoices(): ServiceResponse<string>;
	multipleChoices<T>(body: T): ServiceResponse<T>;

	movedPermanently(): ServiceResponse<string>;
	movedPermanently<T>(body: T): ServiceResponse<T>;

	found(): ServiceResponse<string>;
	found<T>(body: T): ServiceResponse<T>;

	seeOther(): ServiceResponse<string>;
	seeOther<T>(body: T): ServiceResponse<T>;

	notModified(): ServiceResponse<string>;
	notModified<T>(body: T): ServiceResponse<T>;

	temporaryRedirect(): ServiceResponse<string>;
	temporaryRedirect<T>(body: T): ServiceResponse<T>;

	permanentRedirect(): ServiceResponse<string>;
	permanentRedirect<T>(body: T): ServiceResponse<T>;

	// 4xx Client Error
	badRequest(): ServiceResponse<string>;
	badRequest<T>(body: T): ServiceResponse<T>;

	unauthorized(): ServiceResponse<string>;
	unauthorized<T>(body: T): ServiceResponse<T>;

	paymentRequired(): ServiceResponse<string>;
	paymentRequired<T>(body: T): ServiceResponse<T>;

	forbidden(): ServiceResponse<string>;
	forbidden<T>(body: T): ServiceResponse<T>;

	notFound(): ServiceResponse<string>;
	notFound<T>(body: T): ServiceResponse<T>;

	methodNotAllowed(): ServiceResponse<string>;
	methodNotAllowed<T>(body: T): ServiceResponse<T>;

	notAcceptable(): ServiceResponse<string>;
	notAcceptable<T>(body: T): ServiceResponse<T>;

	proxyAuthenticationRequired(): ServiceResponse<string>;
	proxyAuthenticationRequired<T>(body: T): ServiceResponse<T>;

	requestTimeout(): ServiceResponse<string>;
	requestTimeout<T>(body: T): ServiceResponse<T>;

	conflict(): ServiceResponse<string>;
	conflict<T>(body: T): ServiceResponse<T>;

	gone(): ServiceResponse<string>;
	gone<T>(body: T): ServiceResponse<T>;

	lengthRequired(): ServiceResponse<string>;
	lengthRequired<T>(body: T): ServiceResponse<T>;

	preconditionFailed(): ServiceResponse<string>;
	preconditionFailed<T>(body: T): ServiceResponse<T>;

	contentTooLarge(): ServiceResponse<string>;
	contentTooLarge<T>(body: T): ServiceResponse<T>;

	uriTooLong(): ServiceResponse<string>;
	uriTooLong<T>(body: T): ServiceResponse<T>;

	unsupportedMediaType(): ServiceResponse<string>;
	unsupportedMediaType<T>(body: T): ServiceResponse<T>;

	rangeNotSatisfiable(): ServiceResponse<string>;
	rangeNotSatisfiable<T>(body: T): ServiceResponse<T>;

	expectationFailed(): ServiceResponse<string>;
	expectationFailed<T>(body: T): ServiceResponse<T>;

	imATeapot(): ServiceResponse<string>;
	imATeapot<T>(body: T): ServiceResponse<T>;

	misdirectedRequest(): ServiceResponse<string>;
	misdirectedRequest<T>(body: T): ServiceResponse<T>;

	unprocessableContent(): ServiceResponse<string>;
	unprocessableContent<T>(body: T): ServiceResponse<T>;

	locked(): ServiceResponse<string>;
	locked<T>(body: T): ServiceResponse<T>;

	failedDependency(): ServiceResponse<string>;
	failedDependency<T>(body: T): ServiceResponse<T>;

	tooEarly(): ServiceResponse<string>;
	tooEarly<T>(body: T): ServiceResponse<T>;

	upgradeRequired(): ServiceResponse<string>;
	upgradeRequired<T>(body: T): ServiceResponse<T>;

	preconditionRequired(): ServiceResponse<string>;
	preconditionRequired<T>(body: T): ServiceResponse<T>;

	tooManyRequests(): ServiceResponse<string>;
	tooManyRequests<T>(body: T): ServiceResponse<T>;

	requestHeaderFieldsTooLarge(): ServiceResponse<string>;
	requestHeaderFieldsTooLarge<T>(body: T): ServiceResponse<T>;

	unavailableForLegalReasons(): ServiceResponse<string>;
	unavailableForLegalReasons<T>(body: T): ServiceResponse<T>;

	// 5xx Server Error
	error(): ServiceResponse<string>; // 500
	error<T>(body: T): ServiceResponse<T>;

	notImplemented(): ServiceResponse<string>;
	notImplemented<T>(body: T): ServiceResponse<T>;

	badGateway(): ServiceResponse<string>;
	badGateway<T>(body: T): ServiceResponse<T>;

	serviceUnavailable(): ServiceResponse<string>;
	serviceUnavailable<T>(body: T): ServiceResponse<T>;

	gatewayTimeout(): ServiceResponse<string>;
	gatewayTimeout<T>(body: T): ServiceResponse<T>;

	httpVersionNotSupported(): ServiceResponse<string>;
	httpVersionNotSupported<T>(body: T): ServiceResponse<T>;

	variantAlsoNegotiates(): ServiceResponse<string>;
	variantAlsoNegotiates<T>(body: T): ServiceResponse<T>;

	insufficientStorage(): ServiceResponse<string>;
	insufficientStorage<T>(body: T): ServiceResponse<T>;

	loopDetected(): ServiceResponse<string>;
	loopDetected<T>(body: T): ServiceResponse<T>;

	notExtended(): ServiceResponse<string>;
	notExtended<T>(body: T): ServiceResponse<T>;

	networkAuthenticationRequired(): ServiceResponse<string>;
	networkAuthenticationRequired<T>(body: T): ServiceResponse<T>;
}

export const ServiceResponse: ServiceResponseBuilder = {
	// 1xx Informational
	continue(body?: any) {
		return createResponse(100, 'Continue', body);
	},
	switchingProtocols(body?: any) {
		return createResponse(101, 'Switching Protocols', body);
	},
	processing(body?: any) {
		return createResponse(102, 'Processing', body);
	},
	earlyHints(body?: any) {
		return createResponse(103, 'Early Hints', body);
	},

	// 2xx Success
	ok(body?: any) {
		return createResponse(200, 'Ok', body);
	},
	created(body?: any) {
		return createResponse(201, 'Created', body);
	},
	accepted(body?: any) {
		return createResponse(202, 'Accepted', body);
	},
	nonAuthoritativeInformation(body?: any) {
		return createResponse(203, 'Non-Authoritative Information', body);
	},
	noContent(body?: any) {
		return createResponse(204, 'No Content', body);
	},
	resetContent(body?: any) {
		return createResponse(205, 'Reset Content', body);
	},
	partialContent(body?: any) {
		return createResponse(206, 'Partial Content', body);
	},
	multiStatus(body?: any) {
		return createResponse(207, 'Multi-Status', body);
	},
	alreadyReported(body?: any) {
		return createResponse(208, 'Already Reported', body);
	},
	imUsed(body?: any) {
		return createResponse(226, 'IM Used', body);
	},

	// 3xx Redirection
	multipleChoices(body?: any) {
		return createResponse(300, 'Multiple Choices', body);
	},
	movedPermanently(body?: any) {
		return createResponse(301, 'Moved Permanently', body);
	},
	found(body?: any) {
		return createResponse(302, 'Found', body);
	},
	seeOther(body?: any) {
		return createResponse(303, 'See Other', body);
	},
	notModified(body?: any) {
		return createResponse(304, 'Not Modified', body);
	},
	temporaryRedirect(body?: any) {
		return createResponse(307, 'Temporary Redirect', body);
	},
	permanentRedirect(body?: any) {
		return createResponse(308, 'Permanent Redirect', body);
	},

	// 4xx Client Error
	badRequest(body?: any) {
		return createResponse(400, 'Bad Request', body);
	},
	unauthorized(body?: any) {
		return createResponse(401, 'Unauthorized', body);
	},
	paymentRequired(body?: any) {
		return createResponse(402, 'Payment Required', body);
	},
	forbidden(body?: any) {
		return createResponse(403, 'Forbidden', body);
	},
	notFound(body?: any) {
		return createResponse(404, 'Not Found', body);
	},
	methodNotAllowed(body?: any) {
		return createResponse(405, 'Method Not Allowed', body);
	},
	notAcceptable(body?: any) {
		return createResponse(406, 'Not Acceptable', body);
	},
	proxyAuthenticationRequired(body?: any) {
		return createResponse(407, 'Proxy Authentication Required', body);
	},
	requestTimeout(body?: any) {
		return createResponse(408, 'Request Timeout', body);
	},
	conflict(body?: any) {
		return createResponse(409, 'Conflict', body);
	},
	gone(body?: any) {
		return createResponse(410, 'Gone', body);
	},
	lengthRequired(body?: any) {
		return createResponse(411, 'Length Required', body);
	},
	preconditionFailed(body?: any) {
		return createResponse(412, 'Precondition Failed', body);
	},
	contentTooLarge(body?: any) {
		return createResponse(413, 'Content Too Large', body);
	},
	uriTooLong(body?: any) {
		return createResponse(414, 'URI Too Long', body);
	},
	unsupportedMediaType(body?: any) {
		return createResponse(415, 'Unsupported Media Type', body);
	},
	rangeNotSatisfiable(body?: any) {
		return createResponse(416, 'Range Not Satisfiable', body);
	},
	expectationFailed(body?: any) {
		return createResponse(417, 'Expectation Failed', body);
	},
	imATeapot(body?: any) {
		return createResponse(418, "I'm a teapot", body);
	},
	misdirectedRequest(body?: any) {
		return createResponse(421, 'Misdirected Request', body);
	},
	unprocessableContent(body?: any) {
		return createResponse(422, 'Unprocessable Content', body);
	},
	locked(body?: any) {
		return createResponse(423, 'Locked', body);
	},
	failedDependency(body?: any) {
		return createResponse(424, 'Failed Dependency', body);
	},
	tooEarly(body?: any) {
		return createResponse(425, 'Too Early', body);
	},
	upgradeRequired(body?: any) {
		return createResponse(426, 'Upgrade Required', body);
	},
	preconditionRequired(body?: any) {
		return createResponse(428, 'Precondition Required', body);
	},
	tooManyRequests(body?: any) {
		return createResponse(429, 'Too Many Requests', body);
	},
	requestHeaderFieldsTooLarge(body?: any) {
		return createResponse(431, 'Request Header Fields Too Large', body);
	},
	unavailableForLegalReasons(body?: any) {
		return createResponse(451, 'Unavailable For Legal Reasons', body);
	},

	// 5xx Server Error
	error(body?: any) {
		return createResponse(500, 'Internal Server Error', body);
	},
	notImplemented(body?: any) {
		return createResponse(501, 'Not Implemented', body);
	},
	badGateway(body?: any) {
		return createResponse(502, 'Bad Gateway', body);
	},
	serviceUnavailable(body?: any) {
		return createResponse(503, 'Service Unavailable', body);
	},
	gatewayTimeout(body?: any) {
		return createResponse(504, 'Gateway Timeout', body);
	},
	httpVersionNotSupported(body?: any) {
		return createResponse(505, 'HTTP Version Not Supported', body);
	},
	variantAlsoNegotiates(body?: any) {
		return createResponse(506, 'Variant Also Negotiates', body);
	},
	insufficientStorage(body?: any) {
		return createResponse(507, 'Insufficient Storage', body);
	},
	loopDetected(body?: any) {
		return createResponse(508, 'Loop Detected', body);
	},
	notExtended(body?: any) {
		return createResponse(510, 'Not Extended', body);
	},
	networkAuthenticationRequired(body?: any) {
		return createResponse(511, 'Network Authentication Required', body);
	},
};
