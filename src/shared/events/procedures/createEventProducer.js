import config from '../../config/config.js';
import logger from '../../config/logger.js';
import rabitmq from '../../config/rabbitmq.js';

import { CircuitBreaker } from './CircuitBreaker.js';
import { RetryStrategy } from './RetryStrategy.js';
import { EventProducer } from './eventProducer.js';
import { ConfirmChannelManager } from './ConfirmChannelManager.js';

// Factory Design Pattern to create an EventProducer instance with default or overridden dependencies
export function createEventProducer(overrides = {}) {
    const log = overrides.logger || logger;
    const rmq = overrides.rabitmq || rabitmq;
    const queueName = overrides.queueName || config.rabbitmq.queue;

    // Validate required dependencies
    if (!rmq) throw new Error("Rabbitmq connection manager is requied to create EventProducer");
    if (!queueName) throw new Error("Queue name is required to create EventProducer");
    if (!config.rabbitmq.retryAttempts || config.rabbitmq.retryAttempts < 0) throw new Error("Invalid retry attempts configuration. retryStrategy must be a non-negative integer.");

    const channelManager = overrides.channelManager ?? new ConfirmChannelManager({ rabbitmq: rmq, queueName, logger: log });
    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        failureThreshold: 5,
        coolDownMs: 30_000,
        halfOpenMaxAttempts: 3,
        logger: log
    });

    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetries: config.rabbitmq.retryStrategy,
        baseDelayMs: config.rabbitmq.retryDelayMs,
        maxDelayMs: 5_000,
        jitterFactor: 0.3
    });

    return new EventProducer({ channelManager, circuitBreaker, retryStrategy, logger: log, queueName });

}