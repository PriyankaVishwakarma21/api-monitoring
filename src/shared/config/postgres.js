import winston from 'winston';
import config from './config.js';
import logger from './logger.js';
import pg from 'pg';

const { Pool } = pg;

/**
 * Postgres Connection Class
 * This follows the Singleton pattern to ensure that only one instance of the Postgres connection pool exists throughout the application.
 */
class PostgresConnection {
    constructor() {
        this.pool = null;
    }

    /**
     * Get the Postgres connection pool
     * @returns {pg.Pool} The Postgres connection pool
     */
    getPool() {
        if (!this.pool) {
            this.pool = new Pool({
                host: config.postgres.host,
                port: config.postgres.port,
                database: config.postgres.database,
                user: config.postgres.user,
                password: config.postgres.password,
                max: 20, // maximum number of clients in the pool
                idleTimeoutMillis: 30000, // close idle clients after 30 seconds
                connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
            });

            this.pool.on('error', (err) => {
                logger.error('Unexpected error on idle client', err);
            });

            logger.info('Postgres connection pool created successfully');

            return this.pool;
        }
    }

    /**
     * Test the Postgres connection by executing a simple query
     * @returns {Promise<void>}
     */
    async testConnection() {
        try {
            const pool = this.getPool();
            const client = await pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            logger.info('Postgres connection test successful');
        } catch (error) {
            logger.error('Postgres connection test failed:', error);
            throw error;
        }
    }

    /**
     * Execute a query against the Postgres database
     * @param {*} text 
     * @param {*} params 
     * @returns {Promise<pg.QueryResult>} The result of the query
     */
    async query(text, params) {
        const pool = this.getPool();
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            logger.error('Error executing query', { text, error });
            throw error;
        }
    }

    /**
     * Close the Postgres connection pool
     * @returns {Promise<void>}
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger.info('Postgres connection pool closed successfully');
        }
    }


}

export default new PostgresConnection();

