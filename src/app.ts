import mongoose from 'mongoose';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swagger from '../swagger.json';
import morgan from 'morgan';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mjson = require('morgan-json');
import logger, { LoggerStream } from '@/helper/logger';
import path from 'path';

import mailRouter from '@/routes/mail';
import pushRouter from '@/routes/push';
import messageRouter from '@/routes/message';
import deviceRouter from '@/routes/device';
import statisticRouter from '@/routes/statistic';
import admin from '@/routes/admin';
import HttpException from './exceptions/httpException';
import Shutdown from '@/helper/shutdown';

const app: express.Application = express();

const NOTIFICATION_PORT: string = process.env.NOTIFICATION_PORT || '3031';

const format = mjson(':status :method :url :res[content-length] bytes :response-time ms');
app.use(morgan(format, { stream: new LoggerStream('request', 'debug') }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	bodyParser.json({
		limit: 10 * 1024 * 1024, // 10MB
	})
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/mails', mailRouter);
app.use('/push', pushRouter);
app.use('/messages', messageRouter);
app.use('/devices', deviceRouter);
app.use('/statistic', statisticRouter);
app.use('/admin', admin);

app.head('/', (req, res) => {
	res.send(200);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swagger));

app.use((err: HttpException, req: Request, res: Response, next: NextFunction) => {
	// set locals, only providing error in development
	res.locals.message = err.message || 'unknown error';
	res.locals.error = req.app.get('NODE_ENV') !== 'production' ? err : {};
	const status = err.status || 500;

	// tslint:disable-next-line no-console
	console.error(err);

	// render the error page
	res.status(status);
	res.render('error');
});

const db = mongoose.connection;
// tslint:disable-next-line: no-console
db.on('error', console.error.bind(logger, 'connection error:'));
const mongoHost = `mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service`;
logger.info('mongo host', { mongoHost });
mongoose.connect(mongoHost);

logger.info('listen on port ' + NOTIFICATION_PORT + '. Set NOTIFICATION_PORT for change');
const instance = app.listen(NOTIFICATION_PORT);

process.on('SIGINT', () => {
	logger.info('[shutdown] SIGINT received: gracefully shutting down...)');

	Promise.all([Shutdown.httpShutdown(instance), Shutdown.queueShutdown()]).then(() => {
		logger.info('[shutdown] gracefully closed all connections...');
		process.exit();
	});
});
