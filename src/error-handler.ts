import { ApplicationError, ValidationError, NotFoundError } from './errors';
import { Request, Response, NextFunction } from 'express';
import logger from './helper/logger';
import util from 'util';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (err: ApplicationError, req: Request, res: Response, next: NextFunction): void => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// TODO check security issues
	logger.error(util.inspect(err));

	// not found
	if (err instanceof NotFoundError) {
		res.status(404).send({
			status: 404,
			type: 'NotFound',
			title: 'Resource not Found',
			detail: err.message,
		});
	}
	// validation error
	else if (err instanceof ValidationError) {
		res.status(400).send({
			status: 400,
			type: 'ValidationFailed',
			title: 'Input data validation failed',
			detail: err.message,
			validation_errors: err.params,
		});
	}
	// redis connection error
	// TODO implement a class for RedisConnectionError
	else if (err.message && err.message.includes('maxRetriesPerRequest')) {
		res.status(503).send({
			status: 503,
			type: 'RedisConnectionError',
			title: 'Redis Connection failed',
			detail: 'Lost connection to Redis server',
		});
	}
	// internal server error
	else {
		res.status(500).send({
			status: 500,
			type: 'InternalError',
			title: 'Internal Server Error',
			detail: err.message,
		});
	}
};
