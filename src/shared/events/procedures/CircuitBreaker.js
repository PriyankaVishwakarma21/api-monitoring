export const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
})

export class CircuitBreaker {
    constructor(opts = {}) {
        this.failureThreshold = opts.failureThreshold || 5;
        this.cooldownMs = opts.cooldownMs || 30_000;
        this.halfOpenMaxAttempts = opts.halfOpenMaxAttempts || 3;
        this.logger = opts.logger || console;


        this._state = CircuitState.CLOSED;  // Private state variable
        this._failure = 0;
        this._lastFailureTime = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
    }

    _cooldownElapsed() {
        return Date.now() - this._lastFailureTime >= this.cooldownMs;
    }

    _transitionTo(newState) {
        const prev = this._state;
        this._state = newState;
        if (newState === CircuitState.HALF_OPEN) {
            this._halfOpenAttempts = 0;
            this._halfOpenSuccesses = 0;
            this.logger.info(`[Circuit breaker] ${prev} => HALF_OPEN `);
        }
    }

    _openCircuit() {
        this._lastFailureTime = Date.now();
        this._transitionTo(CircuitState.OPEN);
        this.logger.error(`[Circuit breaker] OPEN `, {
            failure: this._failure,
            cooldownMs: this.cooldownMs
        });
    }

    _reset() {
        this._failure = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
        this._transitionTo(CircuitState.CLOSED);
        this.logger.info(`[Circuit breaker] CLOSED `);
    }

    /**
     * Current State
     */
    getState() {
        if (this._state === CircuitState.OPEN && this._cooldownElapsed()) {
            this._transitionTo(CircuitState.HALF_OPEN);
        }
        return this._state;
    }

    allowRequest() {
        const current = this._state;
        if (current == CircuitState.CLOSED) return true;
        if (current == CircuitState.HALF_OPEN) {
            if (this._halfOpenAttempts < this.halfOpenMaxAttempts) {
                this._halfOpenAttempts++;
                return true;
            }
            return false;
        }

        return false; // OPEN state, do not allow
    }

    onSuccess() {
        if (this._state === CircuitState.HALF_OPEN) {
            this._halfOpenSuccesses++;
            if (this._halfOpenSuccesses >= this.halfOpenMaxAttempts) {
                this._reset();
                this.logger.info(`[Circuit breaker] HALF_OPEN => CLOSED `);
            }
        }

        if (this._failure > 0) {
            this._failure = 0; // Reset failure count on success
            this.logger.info(`[Circuit breaker] Reset failure count to 0 `);
        }
    }

    onFailure() {
        if (this._state === CircuitState.HALF_OPEN) {
            this.logger.info(`[Circuit breaker] HALF_OPEN => OPEN `);
            this._openCircuit();
            return;
        }

        this._failure++;
        this._lastFailureTime = Date.now();
        this.logger.warn(`[Circuit breaker] Failure count: ${this._failure} `);

        if (this._failure >= this.failureThreshold) {
            this._openCircuit();
        }
    }

    snapshot() {
        return {
            state: this._state,
            failureCount: this._failure,
            lastFailureTime: this._lastFailureTime,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccesses: this._halfOpenSuccesses
        }
    }
}