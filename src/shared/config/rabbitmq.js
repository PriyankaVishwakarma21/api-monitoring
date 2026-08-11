import amqp from 'amqplib';
import config from './config.js';
import logger from './logger.js';

/**
 * RabbitMQ Connection Class
 * This follows the Singleton pattern to ensure that only one instance of the RabbitMQ connection exists throughout the application.
 */
class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    /**
     * Connects to the RabbitMQ server
     * @returns {Promise<amqp.Channel>} The RabbitMQ channel
     */
    async connect() {
        try {
            if (this.channel) {
                logger.info('RabbitMQ channel already created');
                return this.channel;
            }

            if (this.isConnecting) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (!this.isConnecting) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
                return this.channel;
            }

            try {
                this.isConnecting = true;
                this.connection = await amqp.connect(config.rabbitmq.url);
                this.channel = await this.connection.createChannel();

                // Creating queues
                const dlqName = `${config.rabbitmq.queue}.dlq`;
                await this.channel.assertQueue(dlqName, { durable: true }); // here we are using default exchange, so we don't need to bind the queue to an exchange

                // Normal queue
                await this.channel.assertQueue(config.rabbitmq.queue, { durable: true, arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': dlqName } }); // this is normal queue, and this can send message to dlq if the message is rejected or expired
                logger.info('RabbitMQ connected successfully', config.rabbitmq.queue);

                this.connection.on('close', () => {
                    logger.warn('RabbitMQ connection closed');
                    this.connection = null;
                    this.channel = null;
                });

                this.connection.on('error', (err) => {
                    logger.error('RabbitMQ connection error:', err);
                    this.connection = null;
                    this.channel = null;
                });
            } finally {
                this.isConnecting = false;
            }

            return this.channel;
        } catch (error) {
            this.isConnecting = false;
            logger.error('RabbitMQ connection error:', error);
            throw error;
        }
    }


    /**
     * Gets the RabbitMQ channel
     * @returns {amqp.Channel} The RabbitMQ channel
     */
    getChannel() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not created. Please call connect() first.');
        }
        return this.channel;
    }

    /**
     * Get the status of the RabbitMQ connection
     * @returns {string} The status of the RabbitMQ connection
     */
    getStatus() {
        if (!this.connection || !this.channel) return 'disconnected';
        if (this.connection.closing) return 'closing';
        return 'connected';
    }

    /**
     * Closes the RabbitMQ connection and channel
     * @returns {Promise<void>}
     */
    async close() {
        try {

            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            logger.info('RabbitMQ connection closed successfully');
        } catch (error) {
            logger.error('Error while closing RabbitMQ connection:', error);
            throw error;
        }
    }

}

export default new RabbitMQConnection();