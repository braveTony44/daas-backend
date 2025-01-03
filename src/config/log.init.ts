import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, errors, json, colorize, simple } = format;

const LOG_DIR = process.env.LOG_DIR || 'logs';
const MAX_SIZE = process.env.MAX_SIZE || '20m';
const MAX_FILES = process.env.MAX_FILES || '14d';

const fileTransportOptions = {
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
};

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'daas-service' },
    transports: [
        new DailyRotateFile({
            ...fileTransportOptions,
            dirname: LOG_DIR,
            filename: path.join(LOG_DIR, 'error-%DATE%.log'),
            level: 'error',
        }),
        new DailyRotateFile({
            ...fileTransportOptions,
            dirname: LOG_DIR,
            filename: path.join(LOG_DIR, 'warn-%DATE%.log'),
            level: 'warn',
        }),
        new DailyRotateFile({
            ...fileTransportOptions,
            dirname: LOG_DIR,
            filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
        }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            colorize(),
            simple()
        ),
    }));
}

export default logger;
