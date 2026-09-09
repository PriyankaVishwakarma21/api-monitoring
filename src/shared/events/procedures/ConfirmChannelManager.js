import { EventEmitter } from 'events';

export class ConfirmChannelManager extends EventEmitter {
    constructor({ rabbitmq, logger }) {
        super();
        if (!rabbitmq) {
            throw new Error('RabbitMQ instance is required');
        }
        this.rabbitmq = rabbitmq;
        this.logger = logger ?? console;

        this._channel = null;
        this._connecting = false;
        this._connectWaiters = [];
    }

    async getChannel() {
        if (this._channel) {
            return this._channel;
        }

        if (this._connecting) {
            return new Promise((resolve, reject) => {
                this._connectWaiters.push({ resolve, reject });
            });
        }

        return this._connect();

    }

    async _connect() {
        this._connecting = true;
        try {
            let connection;
            if (this.rabbitmq.connection) {
                connection = this.rabbitmq.connection;
            } else {
                let baseChannel = await this.rabbitmq.connect();
                if (!baseChannel?.connection) {
                    throw new Error('Failed to get RabbitMQ connection');
                }
                connection = baseChannel.connection;
            }

            const confirmChannel = await connection.createConfirmChannel();
            // backpressure handling
            confirmChannel.on('drain', () => {
                this.logger.info('Confirm channel drained, resuming message publishing');
                this.emit('drain');
            });

            confirmChannel.on('close', () => {
                this.logger.info('Confirm channel closed');
                this._channel = null;
                this.emit('close');
            });

            confirmChannel.on('error', (err) => {
                this.logger.error('Confirm channel error:', {
                    error: err.message,
                    stack: err.stack,
                    code: err.code,
                });
                this._channel = null;
                this.emit('error', err);
            });
            this._channel = confirmChannel;
            this.logger.info('Confirm channel created successfully');

            // Resolve any pending promises waiting for the channel. and tell them that the channel is ready
            for (const w of this._connectWaiters) {
                w.resolve(confirmChannel);
            }

            this._connectWaiters = [];
            return confirmChannel;
        } catch (error) {
            for (const w of this._connectWaiters) {
                w.reject(error);
            }

            this._connectWaiters = [];
            return error;
        }
        finally {
            this._connecting = false;
        }
    }
}