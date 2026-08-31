import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './shared/config/config.js';
import logger from './shared/config/logger.js';
import mongodb from './shared/config/mongodb.js';
import postgres from './shared/config/postgres.js';
import rabbitmq from './shared/config/rabbitmq.js';
import errorHandler from './shared/middleware/errorHandler.js';
import ResponseFormatter from './shared/utils/responseFormatter.js';
import cookieParser from 'cookie-parser';

// Routers 
import authRouter from './services/auth/routes/authRouter.js';
import clientRouter from './services/client/routes/clientRoutes.js';

const app = express();
app.use(helmet()); // use helmet to secure the app by setting various HTTP headers
app.use(cors({
    origin: true,
    credentials: true
})); // enable CORS for all routes
app.use(cookieParser())
app.use(express.json()); // parse incoming requests with JSON payloads
app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

/**
 * Health check endpoint to verify if the service is running and healthy.
 * @route GET /health
 * @returns {Object} JSON response with service health status.
 */
app.get('/health', (req, res) => {
    res.status(200).json(ResponseFormatter.success(
        { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() },
        'Service is healthy'))
});

app.get('/', (req, res) => {
    res.status(200).json(ResponseFormatter.success({
            service: 'API Hit Monitoring Service',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                apiHits: '/api/api-hits',
                auth: '/api/auth',
                analytics: '/api/analytics'
            }
        }, 'API Hit Monitoring Service'));
});

app.use('/api/auth', authRouter);
app.use('/api', clientRouter);

/**
 * 404 Error handler for undefined routes.
 */
app.use((req, res, next) => {
    res.status(404).json(ResponseFormatter.error('Route not found', 404));
});

app.use(errorHandler); // Global error handler 


async function initializeConnections() {
    try {
        logger.info('Initializing connections to MongoDB, Postgres, and RabbitMQ...');

        //Connect to MongoDB
        await mongodb.connect();

        //Connect to Postgres
        await postgres.testConnection();

        //Connect to RabbitMQ
        await rabbitmq.connect();

        logger.info('All connections initialized successfully.');

    } catch (err) {
        logger.error('Error initializing connections: ', err);
        throw err;
    }
}


async function startServer() {
    try {
        await initializeConnections();
        
        const server = app.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port}`);
            logger.info(`Environment: ${config.node_env}`);
            logger.info(`API available at: http://localhost:${config.port}`);
        });
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. shutdown gracefully.`);

            server.close(async () => {
                logger.info('HTTP server closed.');
                try {
                    await mongodb.disconnect();
                    await postgres.close();
                    await rabbitmq.close();
                    logger.info('All connections closed successfully.');
                    process.exit(0);
                } catch (err) {
                    logger.error('Error during shutdown: ', err);
                    process.exit(1);
                }

            })

            setTimeout(() => {
                logger.error('Forcing shutdown due to timeout.');
                process.exit(1);
            }, 10000); // 10 seconds timeout

        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // singnal Terminate
        process.on('SIGINT', () => gracefulShutdown('SIGINT '));

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exceotion: ', error);
            gracefulShutdown('uncaughtException');
        })

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at: ', promise, 'reason: ', reason);
            gracefulShutdown('unhandledRejection');
        })
    } catch (err) {
        logger.error('Error starting server: ', err);
        process.exit(1);
    }
}

startServer();