// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorParams = Record<string, any>[];

class ApplicationError extends Error {
	cause: Error | undefined;
	params: ErrorParams;

	constructor(message: string, cause: Error | undefined, params: ErrorParams) {
		super(message);
		this.name = this.constructor.name;
		this.cause = cause;
		this.params = params;
		Error.captureStackTrace(this, this.constructor);
	}
}

class NotFoundError extends ApplicationError {
	constructor(message: string) {
		super(message, undefined, []);
	}
}

class PageNotFoundError extends NotFoundError {
	constructor() {
		super('Page not found');
	}
}

class ValidationError extends ApplicationError {
	constructor(message: string, validationErrors: ErrorParams) {
		super(message, undefined, validationErrors);
	}
}

export { ApplicationError, NotFoundError, PageNotFoundError, ValidationError };
