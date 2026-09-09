import { EVENT_TYPES } from './eventContracts.js';
import { isRetryable } from './procedures/retryStrategy.js';

export class EventProducer {
    constructor({ channelManager, circuitBreaker, retryStrategy, logger, queueName = 'events' }) {
        if (!channelManager) throw new Error("EventProcedure requires channelManger");
        if (!circuitBreaker) throw new Error("EventProcedure requires circuitBreaker");
        if (!queueName) throw new Error("EventProcedure requires queueName");
        if (!retryStrategy) throw new Error("EventProcedure requires retryStrategy");
        this._channelManager = channelManager;
        this._circuitBreaker = circuitBreaker;
        this._logger = logger ?? console;
        this._retry = retryStrategy
        this._queueName = queueName;

        this._matrics = {
            published: 0,
            failed: 0,
            retriesExhausted: 0,
        }
        this._shuttingDown = false;
    }

    _increamentMatrics(matrics) {
        this._matrics[matrics] = (this._matrics[matrics] || 0) + 1;
    }

    async publishApiHit(eventData, opts = {}) {
        if (this._shuttingDown) {
            const error = new Error('EventProducer is shutting down, cannot publish new events');
            error.code = 'SHUTTING_IN_PROGRESS';
            this._logger.error('[EventProducer] publishApiHit failed, shutting down in progress', {
                eventId: eventData.eventId
            });
            throw error;
        }

        if (!this._circuitBreaker.allowsRequest()) {
            this._logger.info('[EventProducer] circuit breaker rejected publish', {
                eventId: eventData.eventId,
                state: this._circuitBreaker.state,
            });
            return false;
        };

        const corelationId = opts.corelationId || eventData.eventId;
        const startMS = Date.now();
        let attempt = 0;
        while (true) {
            try {
                await this._publish(eventData, { corelationId, attempt });
                const latency = Date.now() - startMS;
                this._circuitBreaker.onSuccess();
                this._increamentMatrics('published');
                this._logger.info('[EventProducer] message published successfully', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    latency,
                    endpoint: eventData.endpoint,
                });
                return true;
            }
            catch (err) {
                // this._increamentMatrics('failed');
                // this._circuitBreaker.recordFailure();
                this._logger.error('[EventProducer] message publish failed', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    error: err.message,
                    stack: err.stack,
                    code: err.code,
                });

                const canRetry = isRetryable(err) && this._retry.shouldRetry(attempt);

                if (!canRetry) {
                    this._circuitBreaker.onFailure();
                    this._increamentMatrics('failed');
                    if (!this._retry.shouldRetry(attempt)) {
                        this._increamentMatrics('retriesExhausted');
                    }
                    this._logger.error('[EventProducer] message publish failed, retries exhausted', {
                        eventId: eventData.eventId,
                        attempt: attempt + 1,
                        error: err.message,
                        stack: err.stack,
                        code: err.code,
                    });
                    throw err;
                }

                await this._retry.wait(attempt);
                attempt++;

            }
        }
    }

    async _publish(eventData, { corelationId, attempt = 0 } = {}) {
        const channel = await this._channelManager.getChannel();

        const message = {
            type: EVENT_TYPES.API_HIT,
            data: eventData,
            publishedAt: new Date().toISOString(),
            attempt: attempt + 1,
        };
        const messageBuffer = Buffer.from(JSON.stringify(message));

        const publishOptions = {
            persistent: true,
            contentType: 'application/json',
            messageId: eventData.eventId,
            correlationId: corelationId,
            timestamp: Math.floor(Date.now() / 1000),
        }

        return new Promise((resolve, reject) => {
            const written = channel.publish('', this._queueName, messageBuffer, publishOptions, (err, ok) => {
                if (err) {
                    this._logger.error('Failed to publish message:', err);
                    return reject(new Error(`Failed to publish message: ${err.message}`));
                }
                resolve(ok);
            });

            if (!written) {
                this._logger.warn('[EventProducer] back-pressure detected, waiting for drain event', {
                    eventId: eventData.eventId,
                });
            }

            const onDrain = () => {
                channel.removeListener('drain', onDrain);
                this._logger.info('[EventProducer] drain event received, resuming message publishing', {
                    eventId: eventData.eventId,
                });
            };

            channel.once('drain', onDrain);
        });
    }

    async shutdown() {
        this._shuttingDown = true;
        this._logger.info('[EventProducer] shutting down, waiting for pending messages to be published');
        await this._channelManager.close();
        this._logger.info('[EventProducer] shutdown complete');
    }

    getStats() {
        return {
            metrics: { ...this._matrics },
            circuitBreaker: this._circuitBreaker.snapshot(),
        }
    }

}