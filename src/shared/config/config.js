import dotenv from 'dotenv';
dotenv.config();

const config = {
    // Server
    node_env: process.env.NODE_ENV || 'dev',
    port: parseInt(process.env.PORT || '5000', 10),

    // MondoDB
    mongo: {
        uri: process.env.MONGO_URL || 'mongodb://localhost:27017/api_monitoring',
        dbName: process.env.MONGO_DB_name || 'api_monitoring'
    },

    // Postgres 
    postgres: {
        host: process.env.PG_HOTS || 'localhost',
        port: parseInt(process.env.PG_PORT, '5432', 10),
        database: process.env.PG_DATABASE || 'api_monitoring',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres'
    },

    // rabbitmq
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        queue: process.env.RABBITMQ_QUEUE || 'api_hits',
        publisherConfirm: process.env.RABBITMQ_PUBLISHER_CONFIRM == 'true' || false, // message lost
        retryAttemps: parseInt(process.env.RABBITMQ_RETRY_ATTEMPS || '3', 10),
        retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '1000', 10),
    },

    // jwt
    jwt: {
        secret: process.env.JWT_SCRETE || 'testing',
        expireIn: process.env.JWT_EXPIRE_IN || '24h'
    },

    // Rate Limit
    rateLimt: {
        windowMS: parseInt(process.env.RATE_LIMIT_WINDOWS_MS || '90000', 10), //15 minutes in ms
        maxRequest: parseInt(process.env.RATE_LIMIT_MAX_REQUEST || '1000', 10)// 1000 req / 15 min per IP
    },

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV == 'prod',
        maxAge: 24 * 60 * 60 * 1000
    }
}

export default config;