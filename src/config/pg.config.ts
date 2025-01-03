import { Pool } from 'pg';

function createPostgresConnection(connectionString: string): Pool {
    const pool = new Pool({
        connectionString: connectionString,
    });

    pool.on('connect', () => {
        console.log('Connected to the PostgreSQL database');
    });

    pool.on('error', (err) => {
        console.error('Error connecting to the PostgreSQL database', err);
    });

    return pool;
}

export default createPostgresConnection;