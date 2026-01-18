export type ServiceResponse<Status extends number = number, TBody = null> = { status: Status; body: TBody; message: string };

const KnownResponses = Object.freeze({
	// 1xx Informational
	100: ['continue', 'Continue'] as const,
	101: ['switchingProtocols', 'Switching Protocols'] as const,
	102: ['processing', 'Processing'] as const,
	103: ['earlyHints', 'Early Hints'] as const,
	// 2xx Success
	200: ['ok', 'Ok'] as const,
	201: ['created', 'Created'] as const,
	202: ['accepted', 'Accepted'] as const,
	203: ['nonAuthoritativeInformation', 'Non-Authoritative Information'] as const,
	204: ['noContent', 'No Content'] as const,
	205: ['resetContent', 'Reset Content'] as const,
	206: ['partialContent', 'Partial Content'] as const,
	207: ['multiStatus', 'Multi-Status'] as const,
	208: ['alreadyReported', 'Already Reported'] as const,
	226: ['imUsed', 'IM Used'] as const,
	// 3xx Redirection
	300: ['multipleChoices', 'Multiple Choices'] as const,
	301: ['movedPermanently', 'Moved Permanently'] as const,
	302: ['found', 'Found'] as const,
	303: ['seeOther', 'See Other'] as const,
	304: ['notModified', 'Not Modified'] as const,
	307: ['temporaryRedirect', 'Temporary Redirect'] as const,
	308: ['permanentRedirect', 'Permanent Redirect'] as const,
	// 4xx Client Error
	400: ['badRequest', 'Bad Request'] as const,
	401: ['unauthorized', 'Unauthorized'] as const,
	402: ['paymentRequired', 'Payment Required'] as const,
	403: ['forbidden', 'Forbidden'] as const,
	404: ['notFound', 'Not Found'] as const,
	405: ['methodNotAllowed', 'Method Not Allowed'] as const,
	406: ['notAcceptable', 'Not Acceptable'] as const,
	407: ['proxyAuthenticationRequired', 'Proxy Authentication Required'] as const,
	408: ['requestTimeout', 'Request Timeout'] as const,
	409: ['conflict', 'Conflict'] as const,
	410: ['gone', 'Gone'] as const,
	411: ['lengthRequired', 'Length Required'] as const,
	412: ['preconditionFailed', 'Precondition Failed'] as const,
	413: ['contentTooLarge', 'Content Too Large'] as const,
	414: ['uriTooLong', 'URI Too Long'] as const,
	415: ['unsupportedMediaType', 'Unsupported Media Type'] as const,
	416: ['rangeNotSatisfiable', 'Range Not Satisfiable'] as const,
	417: ['expectationFailed', 'Expectation Failed'] as const,
	418: ['imATeapot', "I'm a teapot"] as const,
	421: ['misdirectedRequest', 'Misdirected Request'] as const,
	422: ['unprocessableContent', 'Unprocessable Content'] as const,
	423: ['locked', 'Locked'] as const,
	424: ['failedDependency', 'Failed Dependency'] as const,
	425: ['tooEarly', 'Too Early'] as const,
	426: ['upgradeRequired', 'Upgrade Required'] as const,
	428: ['preconditionRequired', 'Precondition Required'] as const,
	429: ['tooManyRequests', 'Too Many Requests'] as const,
	431: ['requestHeaderFieldsTooLarge', 'Request Header Fields Too Large'] as const,
	451: ['unavailableForLegalReasons', 'Unavailable For Legal Reasons'] as const,
	// 5xx Server Error
	500: ['error', 'Internal Server Error'] as const,
	501: ['notImplemented', 'Not Implemented'] as const,
	502: ['badGateway', 'Bad Gateway'] as const,
	503: ['serviceUnavailable', 'Service Unavailable'] as const,
	504: ['gatewayTimeout', 'Gateway Timeout'] as const,
	505: ['httpVersionNotSupported', 'HTTP Version Not Supported'] as const,
	506: ['variantAlsoNegotiates', 'Variant Also Negotiates'] as const,
	507: ['insufficientStorage', 'Insufficient Storage'] as const,
	508: ['loopDetected', 'Loop Detected'] as const,
	510: ['notExtended', 'Not Extended'] as const,
	511: ['networkAuthenticationRequired', 'Network Authentication Required'] as const,
});

export const getResponseMessage = (status: number) => KnownResponses[status as keyof KnownResponses]?.[1] ?? 'Unknown';

type KnownResponses = typeof KnownResponses;

export interface ResponseFn<Status extends number> {
	(): ServiceResponse<Status>;
	<T>(body: T | null): ServiceResponse<Status, T>;
}

export type ResponseBuilder = {
	(status: number): ServiceResponse<number>;
	<T>(status: number, body: T | null): ServiceResponse<number, T>;
} & {
	[P in keyof KnownResponses as KnownResponses[P][0]]: ResponseFn<P>;
};

class Response<Status extends number, T> {
	status;
	body;

	constructor(status: Status, body?: T) {
		this.status = status;
		this.body = body !== undefined ? body : null;
	}

	get message() {
		return getResponseMessage(this.status);
	}

	toJSON() {
		return { status: this.status, body: this.body ?? this.message };
	}
}

export const ServiceResponse = (() => {
	function ServiceResponse(status: number, body?: any) {
		return new Response(status, body);
	}

	const builder = ServiceResponse as unknown as ResponseBuilder;

	Object.getOwnPropertyNames(KnownResponses).forEach((code) => {
		const key = +code as keyof typeof KnownResponses;
		const [fnName] = KnownResponses[key];
		(builder as any)[fnName] = (body?: any) => new Response(key, body);
	});
	return Object.freeze(builder);
})();
