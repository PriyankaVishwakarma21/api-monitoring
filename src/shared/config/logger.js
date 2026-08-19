import winston from "winston";
import config from './config.js';

/**
 * Winston Logger Configuration
 */
const logger = winston.createLogger({
    level: config.node_env === 'prod' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'api_monitoring' },
    // To store the logs
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combine.log' }) // expect error other log will goes inside combine.log file
    ]
})

if (config !== 'prod') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }))
}

export default logger;