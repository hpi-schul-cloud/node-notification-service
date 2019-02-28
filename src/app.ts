import mongoose from 'mongoose';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
const mjson = require('morgan-json');
import logger, { LoggerStream } from '@/config/logger';

import statisticRouter from '@/routes/statistic';
import mailRouter from '@/routes/mail';
import pushRouter from '@/routes/push';
import messageRouter from '@/routes/message';
import deviceRouter from '@/routes/device';
import HttpException from './exceptions/httpException';
import BaseService from './services/BaseService';


const app: express.Application = express();

const port: string = process.env.NOTIFICATION_PORT || '3000';

const format = mjson(':status :method :url :res[content-length] bytes :response-time ms');
app.use(morgan(format, { stream: new LoggerStream('request') }));
process.stdout.pipe(logger);
process.stderr.pipe(logger);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/statistic', statisticRouter);
app.use('/mails', mailRouter);
app.use('/push', pushRouter);
app.use('/messages', messageRouter);
app.use('/devices', deviceRouter);

app.get('/', (req, res) => {
	res.send('hello world!');
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

// Test Endpoint for user pagination
app.get('/users', (req, res) => {
	const users = [
		{
			name: 'Bob',
			mail: 'bob@bob.bob',
			payload: {
				course: 'Bobs Course',
				week: 6,
			},
			language: 'en',
			preferences: {
				push: true,
				mail: true,
			},
		},
		{
			name: 'Alice',
			mail: 'alice@alice.alice',
			payload: {
				course: 'Alices Course',
				week: 4,
			},
			language: 'de',
			preferences: {
				push: true,
				mail: true,
			},
		},
	];
	if (!req.query.page) {
		res.json({
			data: users,
		});
		return;
	}
	if (req.query.page >= users.length) {
		res.json({
			data: [],
		});
		return;
	}
	const links = {
		next: `http://localhost:3000/users?page=${parseInt(req.query.page, 10) + 1}`,
	};
	res.json({
		data: [users[req.query.page]],
		links: req.query.page + 1 >= users.length ? {} : links,
	});
});

app.use((err: HttpException, req: Request, res: Response, next: NextFunction) => {
	// set locals, only providing error in development
	res.locals.message = err.message || 'unknown error';
	res.locals.error = req.app.get('NODE_ENV') !== 'production' ? err : {};
	const status = err.status || 500;

	// render the error page
	res.status(status);
	res.render('error');
});

const db = mongoose.connection;
// tslint:disable-next-line: no-console
db.on('error', console.error.bind(logger, 'connection error:'));
mongoose.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service`);

const instance = app.listen(port);

process.on('SIGINT', () => {
	logger.info('[shutdown] SIGINT received: gracefully shutting down...)');
	logger.info('[shutdown] close http connections...');
	instance.close(async () => {
		logger.info('[shutdown] http connections closed.');
		logger.info('[shutdown] close message queue instances...');
		await BaseService.close();
		logger.info('[shutdown] closed message queue instances.');
		logger.info('[shutdown] exit...');
		process.exit();

	});
});
