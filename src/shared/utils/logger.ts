import winston from 'winston';
import { serverConfig } from '../../infrastructure/config/server.config';

const logger = winston.createLogger({
  level: serverConfig.logLevel,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'notification-events-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export default logger;
