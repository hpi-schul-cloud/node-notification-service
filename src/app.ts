import mongoose from 'mongoose';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swagger from './swagger.json';
import morgan from 'morgan';
import logger, { LoggerStream } from '@/helper/logger';
import mailRouter from '@/routes/mail';
import statisticRouter from '@/routes/statistic';
import errorHandler from '@/error-handler';
import configuration from '@/configuration';
import QueueManager from '@/services/QueueManager';
import MailService from '@/services/MailService';
import { Server } from 'http';
import promBundle from 'express-prom-bundle';
import * as bullProm from 'bull-prom';
import { NotFoundError } from './errors';

const app: express.Application = express();

const NOTIFICATION_HOST = process.env.NOTIFICATION_HOST || '0.0.0.0';
const NOTIFICATION_PORT = parseInt(process.env.NOTIFICATION_PORT || '3031');

// middlewares
app.use(express.json({ limit: 10 * 1024 * 1024 })); // 10MB limit
app.use(express.urlencoded({ extended: true }));

const logFormat = ':status :method :url :res[content-length] bytes - :response-time ms';
app.use(morgan(logFormat, { stream: new LoggerStream('request', 'debug') }));

// http metrics
const promMetrics = promBundle({ includePath: true });
app.use(promMetrics);

// services
const queueManager = new QueueManager();
const mailService = new MailService(queueManager, configuration);

// queue metrics
const bullMetric = bullProm.init({
	interval: 1000, // optional, in ms, default to 60000
});
queueManager.queues.forEach((queue) => bullMetric.start(queue));

// routes
app.use('/mails', mailRouter(mailService));
app.use('/statistic', statisticRouter(queueManager));

app.head('/', (req, res) => {
	res.send(200);
});

// swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swagger));

// 404
app.use((req, res, next) => {
	next(new NotFoundError('The requested resource was not found.'));
});

// error handler (has to be the last middleware)
app.use(errorHandler);

// the mongodb connection
const db = mongoose.connection;
// https://mongoosejs.com/docs/connections.html#connection-events
db.on('error', (error) => {
	logger.error('[mongodb] error:', error);
});
db.on('disconnected', (error) => {
	logger.error('[mongodb] disconnected:', error);
});
db.on('reconnectFailed', (error) => {
	logger.error('[mongodb] reconnectFailed:', error);
});
const mongoEvents = ['connecting', 'connected', 'disconnecting', 'close', 'reconnected', 'fullsetup', 'all'];
mongoEvents.forEach((event) => {
	db.on(event, () => {
		logger.debug(`[mongodb] ${event}`);
	});
});

// the server instance
let server: Server;

const run = async () => {
	// IMPORTANT: We require successful connection to Redis and MongoDB
	// before starting the HTTP listener

	// TODO make workers configurable optional
	await mailService.startWorkers();

	const mongoURI = `mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service`;
	await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

	// TODO make producer configurable optional
	server = app.listen(NOTIFICATION_PORT, NOTIFICATION_HOST, () => {
		logger.info(`Listening on ${NOTIFICATION_HOST}:${NOTIFICATION_PORT}`);
	});
};

const shutDown = async () => {
	logger.info('[shutdown] Shutting down gracefully...');

	const httpClose = () => server.close();
	const queueClose = () => queueManager.closeAll();
	const mongoClose = () => db.close();

	await Promise.all([httpClose, queueClose, mongoClose]);
	logger.info('[shutdown] All connections closed');
	process.exit();
};

process.on('unhandledRejection', (error: Error) => {
	// this is not catched by ioredis
	if (error.name === 'MaxRetriesPerRequestError') {
		logger.debug(error.message);
	} else {
		logger.error('Unhandled rejection:', error);
	}
});

process.on('SIGINT', async () => {
	logger.info('[shutdown] SIGINT received)');
	await shutDown();
});

// start server
run().catch((error) => {
	logger.error(`[fatal] Aborting.`, error);
	shutDown();
});
