import mongoose from "mongoose";
import config from "./config";
import logger from "./logger";

/**
 * MongoDB Connection Class
 * This follows the Singleton pattern to ensure that only one instance of the MongoDB connection exists throughout the application.
 */
class MongoConnection {
    constructor() {
        this.connection = null;
    }

    /**
     * Connect to MongoDB
     * @returns {Promise<mongoose.Connection>} The MongoDB connection
     */
    async connect() {
        try {
            if (this.connection) {
                logger.info('MongoDB already connected');
                return this.connection;
            }

            await mongoose.connect(config.mongo.uri, {
                dbName: config.mongo.dbName,
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            this.connection = mongoose.connection;
            logger.info('MongoDB connected successfully');

            this.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
            });

            this.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            return this.connection;
        } catch (error) {
            logger.error('MongoDB connection error:', error);
            throw error;
        }
    }


    /**
     * Disconnect from MongoDB
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                this.connection = null;
                logger.info('MongoDB disconnected successfully');
            } else {
                logger.warn('MongoDB is not connected');
            }
        } catch (error) {
            logger.error('Error while disconnecting MongoDB:', error);
            throw error;
        }
    }

    /**
     * Get the current MongoDB connection
     * @returns {mongoose.Connection} The current MongoDB connection
     */
    getConnection() {
        if (!this.connection) {
            throw new Error('MongoDB is not connected. Please call connect() first.');
        }
        return this.connection;
    }
}

export default new MongoConnection();