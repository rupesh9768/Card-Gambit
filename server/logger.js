import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({ format: combine(colorize(), timestamp(), logFormat) }),
    new winston.transports.File({ filename: path.resolve('logs', 'app.log'), level: 'info' }),
  ],
});

// morgan compatibility
logger.stream = {
  write: (message) => {
    // morgan adds a newline at the end
    logger.info(message.trim());
  },
};

export default logger;
