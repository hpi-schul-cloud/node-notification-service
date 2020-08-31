import appRoot from 'app-root-path';
import { createLogger, transports, format } from 'winston';
const { combine, timestamp, colorize } = format;


// instantiate a new Winston Logger with the settings defined above
const isProductionMode = process.env.NODE_ENV === 'production';

let level = 'debug';
let logFormat = combine(
	timestamp(),
	colorize(),
	format.simple(),
);

if (isProductionMode) {
	level = 'error';
	logFormat = combine(
		timestamp(),
		format.simple(),
	);
}
const logger = createLogger({
	transports: [
		new (transports.Console)({
			level,
			handleExceptions: true,
			format: logFormat,
		}),
	],
	exitOnError: false,
});

export class LoggerStream {
	public name: string;
	public level: string;

	constructor(name: string, level?: string) {
		this.name = name;
		this.level = level || 'info';
	}
	public write(message: string) {
		if (this.name) {
			logger.log(this.level, this.name + ' ' + message);
		} else {
			logger.info(this.level, message);
		}
	}
}

if (isProductionMode) {
	console.log('Logging initialized at production level'); 
} else {
	logger.debug('Logging initialized at development level, set NODE_ENV === \'production\' for production use.');
}

export default logger;
