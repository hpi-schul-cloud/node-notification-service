import ApplicationError from './exceptions/ApplicationError';
import { Request, Response, NextFunction } from 'express';
import logger from './helper/logger';
import util from 'util';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (err: ApplicationError, req: Request, res: Response, next: NextFunction): void => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	logger.error(util.inspect(err));

	// not found
	if (err.status === 404) {
		res.status(404).send({
			message: err.message,
			type: 'NotFound',
			data: {},
		});
	}
	// validation error
	else if (err.status === 400 || err.status === 422) {
		res.status(err.status).send({
			message: err.message,
			type: 'ValidationError',
			data: err.details,
		});
	}
	// internal server error
	else {
		res.status(500).send({
			message: err.message,
			type: 'UnknownError',
			data: {},
		});
	}
};
