import appRoot from 'app-root-path';
import { createLogger, transports, format } from 'winston';
const { combine, timestamp, colorize } = format;


// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
  transports: [
    new (transports.Console)({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      handleExceptions: true,
      format: combine(
        timestamp(),
        colorize(),
        format.simple(),
      ),
    }),
    new (transports.File)({
      filename: `${appRoot}/logs/app.log`, level: 'info',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: combine(
        timestamp(),
      ),
    }),
  ],
  exitOnError: false,
});

export class LoggerStream {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
  public write(message: string) {
    if (this.name) {
      logger.info(this.name + ' ' + message);
    } else {
      logger.info(message);
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  logger.debug('Logging initialized at production level');
} else {
  logger.debug('Logging initialized at development level');
}

export default logger;
