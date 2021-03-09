import { createLogger, transports, format } from 'winston';
const { combine, timestamp, colorize } = format;
import * as Transport from 'winston-transport';

// instantiate a new Winston Logger with the settings defined above
const isProductionMode = process.env.NODE_ENV === 'production';

let level = 'debug';
let logFormat = combine(timestamp(), colorize(), format.simple());

if (isProductionMode) {
	level = 'warn';
	logFormat = combine(timestamp(), format.simple());
}

// This is a rather hacky way of extending winston-transport type definition,
// because it was not compiled to the latest updates inside the library.
// TODO: remove when .d.ts file was fixed in winston-transport
interface WinstonTransport extends Transport {
	handleRejections?: boolean;
}

const consoleTransport: WinstonTransport = new transports.Console({
	level,
	handleExceptions: true,
	format: logFormat,
});

consoleTransport.handleRejections = true;

const logger = createLogger({
	transports: [consoleTransport],
	exitOnError: false,
});

export class LoggerStream {
	public name: string;
	public level: string;

	constructor(name: string, level?: string) {
		this.name = name;
		this.level = level || 'info';
	}
	public write(message: string): void {
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
	logger.debug("Logging initialized at development level, set NODE_ENV === 'production' for production use.");
}

export default logger;
